import torch
import os
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form , Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import librosa
from scipy.io.wavfile import write
import subprocess
from fastapi import Request
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from openai import OpenAI
from fastapi.responses import JSONResponse
from pydantic import BaseModel 
from langchain.chains import ConversationChain
from langchain.chains.conversation.memory import ConversationBufferMemory
import requests
from fastapi import HTTPException


os.environ["OPENAI_API_KEY"] = "your-key"

app = FastAPI()

class StoryInput(BaseModel):
    story: str

class TextInput(BaseModel):
    speech: str
    
class QuestionInput(BaseModel):
    story: str 
    speech: str 
    question: str 

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

question= ""
temp= ""

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_DIR = "./uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)




@app.post('/text')
async def inference(text: str = Form(...)):
    answer = answer_chain.run({'prompt': text})
    return {'text': answer}
    

@app.post('/voice')
async def inference(text: str = Form(...)):



    # Sending the request to the TTS API
    client = OpenAI()
    
    response = client.audio.speech.create(
    model="tts-1",
    voice="nova",
    input= text)
    
    audio_path= "output.mp3"
    response.stream_to_file(audio_path)

    with open(audio_path, "wb") as audio_file:
        audio_file.write(response.content)
    
    # Serving the saved audio file
    return FileResponse(audio_path, media_type="audio/mpeg")


@app.post('/storyqa') 
async def storyqa(request: Request, input_data: StoryInput):
    print("received story")
    story = input_data.story
    print(story)
    
    template = """You are given this urdu story and you have to ask a question based on this story from the user in urdu.
{story}
"""
     
    prompt_template = PromptTemplate(input_variables=["story"], 
    template=template)
    
    llm = OpenAI( model_name="gpt-4")
    
  #  llm = ChatOpenAI(temperature=0.5, model_name="gpt-4")
    answer_chain = LLMChain(llm=llm, prompt=prompt_template)
    
    chatbot_response = answer_chain.run(story) 
    question= chatbot_response 
    return JSONResponse(content={"response": chatbot_response})

  
  
@app.post('/storychain') 
async def storyqa(request: Request, input_data: QuestionInput):
    print("received story")
    story = input_data.story
    answer = input_data.speech
    question= input_data.question

    template = """You are given this urdu story, an urdu question related to the story, and an answer to that question. You have to tell if the answer is correct or not in urdu and give explanation how it is incorrect in urdu, and ask another question from the user relevant to the story in urdu.
{story}
System: {question}
User: {answer}
System:
"""
     
    prompt_template = PromptTemplate(input_variables=["story", "question" , "answer"], 
    template=template)
    
    llm = OpenAI( model_name="gpt-4")
    answer_chain = LLMChain(llm=llm, prompt=prompt_template)
    
    inputs = {
    'story': story,
    'question': question,
    'answer': answer}
    
    chatbot_response = answer_chain.run(inputs) 
    return JSONResponse(content={"response": chatbot_response})
  
    

@app.post('/general') 
async def general(request: Request,  input_data: TextInput):
    text= input_data.speech 

    
    template= """You are a chatbot who only converses in urdu with the user. 
    User: {speech}"""
     
    prompt_template = PromptTemplate(input_variables=["speech"] ,template=template)
    
    llm = OpenAI( model_name="gpt-4")
    answer_chain = LLMChain(llm=llm, prompt=prompt_template)
    
    
    chatbot_response= answer_chain.run(text) 
    return JSONResponse(content={"response": chatbot_response})

    
@app.get('/game') 
async def game(request: Request):
    text= ""

    
    template= """You are a storytelling game player, who gives the initial starting sentence of the story in urdu.{text}"""
     
    prompt_template = PromptTemplate(input_variables=["text"] ,template=template)
    
    llm = OpenAI( model_name="gpt-4")
    answer_chain = LLMChain(llm=llm, prompt=prompt_template)
    
    
    chatbot_response= answer_chain.run(text) 
    return JSONResponse(content={"response": chatbot_response})


@app.post('/story')
async def story(request: Request,  input_data: TextInput):
    text= input_data.speech 
    print(text)

    
    template= """You have to generate a story in urdu language only according to the user specifications, if there are no particular  specifications generate a folk tale or some story related to cultures or traditions of Pakistan."""
    client= OpenAI()
    
    response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": template},
                {"role": "user", "content": text},
            ]
        )
    response_text = response.choices[0].message.content
    print(response_text)
    return JSONResponse(content={"response": response_text})
    

@app.post('/gamechain') 
async def gamechain(request: Request,  input_data: TextInput):
    text= input_data.speech 
    print(text)

    
    template= """You are a general chatbot that only converses in Urdu.
Whenever a user would say "Urdu parhtay hain" or some variation of it you should begin asking quiz questions unless instructed otherwise. Examples of quiz questions you can ask them are presenting them with an urdu word and asking for their opposites (mutazaad) or definitions. 

You also entertain users by engaging them with a Choose your Own adventure story by guiding them through a short Urdu version of a popular folk tale recontexualized for Pakistan. After you tell 1-2 lines of this story wait for the user to continue where you have left and then continue the story based on the users response.
Whenever a user would say "Adventure Kahaani" or some variation of it you should begin telling a Choose your Own adventure type story unless instructed otherwise.
Make sure your outputs are text to speech friendly. Make sure you format your output so that it is in paragraph form without any punctuation marks like commas or question marks or such it should not include any bullet points or similar lists paragraph form only.
You are a storytelling game player, who gives the initial starting 1-2 sentence of the story in urdu when the user says "Kahani safar kheltay hien". 

When the user says "Kahaani khatam" you conclude the story and ask the user what next would he want to do in urdu. 
"""
    client= OpenAI()
    
    response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": template},
                {"role": "user", "content": text},
            ]
        )
    response_text = response.choices[0].message.content
    print(response_text)
    return JSONResponse(content={"response": response_text})


