import React, { useState, useRef, useEffect } from 'react';
import MicRecorder from "mic-recorder-to-mp3"
import axios from "axios"
import './index.css';
import firebase from './firebase';
import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';


const ChatBox = () => {
  
  const [response, setResponse] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordedSpeech, setRecordedSpeech] = useState("");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  var question= ""
  
  var story = "ایک دن ایک کوا چھت پر بیٹھا ہوا تھا۔ دن کے گرمی سے کوا بہت پیاسا ہوگیا۔ اچانک ایک کھولے ہوئے پانی کی گہری گڑھا ملی۔ کوآ نے دیکھا کہ گڑھے میں پانی بہت نیچے ہے اور اس تک پہنچنے کے لئے وہاں پہنچنے کے لئے گہرے کھائی کی ضرورت پڑے گی۔ کوآ کو پانی کی شدت سے دلی سمجھ آگئی اور اس نے فوراً فوراً چار-پانچ چھتیں ماریں تاکہ پانی بلند ہوجائے اور وہ پیاس بجھا سکے۔ لیکن اس کی کوششوں سے بھی گہری گڑھے کی بلندی کم نہ ہو سکی۔ کوآ ہر دفعہ پیاس سے تڑپ رہا تھا۔   تب اچانک ایک آلوچے کی تھیلی اُس کے نزدیک آئی جس میں چھوٹا سا پانی کا گڑھا تھا۔ کوآ نے خوشی سے دیکھا اور اپنے دوستوں کو بلانے لگا۔ کوآ نے تھیلی کے کھچے کوچے پانی کو اچھالا اور دیکھا کہ پانی کی موج اوپر جا رہی ہے۔ کوآ نے اب مزید چھتیں ماریں اور پانی بھرا گڑھا نیچے ہلکا ہوا۔ کوآ نے اب آسانی سے پانی کو پہنچا اور پیاس بجھا دی۔ اب کوآ نے اپنے دوستوں کا شکریہ ادا کیا جو اس کی مدد کر کے اس کی پیاس بجھا دی۔ اس داستان سے ہمیں یہ سبق ملتا ہے کہ محنت اور ثابت قدمی سے مشکلات کو آسانی سے مقابلہ کیا جاسکتا ہے۔ ہمیشہ حلقہ دار روشنی کا انتظام کرنا چاہئے تاکہ آنے والی نسل کو بھی ہمارے ان جیون مشقتوں کا مثال ملے۔ اسی طرح اچھے کاموں کی تلاش میں کبھی بھی مایوس نہیں ہونا چاہئے۔ اگر ہم جذبہ، لگن اور تواضع سے کام لیں تو ہم ہمیشہ کامیاب ہوں گے۔"
  
  const recognition = new window.webkitSpeechRecognition();
  recognition.interimResults = true;
  recognition.lang = "ur-PK";

  recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");

    setRecordedSpeech(transcript);
    setInputText(transcript);
  };  
  
  const handleServerResponse = (response) => {
    setMessages([...messages, { type: "bot", text: response }]);
  };

  const textareaRef = useRef(null);

  const recorder = useRef(null)
  const audioPlayer = useRef(null)
  const [isInUse, setIsInUse] = useState(null)
  const [isLoading, setIsLoading] = useState(null)
  
  const sendButton = document.getElementById('send-button');
  const recordButton = document.getElementById('record-button');


// ig this is asr or tts maybe not needed 
  const callVoice = async (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    setIsLoading(true)
    axios.post('http://127.0.0.1:8000/voice', formData, {
      headers: {
      'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob'
    }).then(response => {
      setIsInUse(false)
      setIsLoading(false)
      const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setMessages((messages) => [...messages, {type: 'audio-reply', bloburl: audioUrl}])
    })
    .catch(error => {
      setIsInUse(false)
      setIsLoading(false)
      console.log(error)
    })
  };

// tts or asr 
  const callText = async (text) => {
    const formData = new FormData();
    formData.append('text', text);
    setIsLoading(true)
    axios.post('http://127.0.0.1:8000/text', formData, {
      headers: {
      'Content-Type': 'multipart/form-data'
      }
    }).then(response => {
      setIsInUse(false)
      setIsLoading(false)
      setMessages((messages) => [...messages, {type: 'reply', text: response.data.text}])
    })
    .catch(error => {
      setIsInUse(false)
      setIsLoading(false)
      console.log(error)
    })
  }

  useEffect(() => {
    recorder.current = new MicRecorder({ bitRate: 128 })
  }, [])
  
  
  //firebase storage 
async function uploadVoiceRecording(blob) {
    // Construct the reference directly, without needing `.child`
    const voiceRef = ref(storage, `voice_recordings/${Date.now()}.mp3`);

    const uploadTask = uploadBytesResumable(voiceRef, blob);

    // Wait for the upload to complete
    const snapshot = await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                // You can add progress monitoring here if needed
            },
            (error) => reject(error),
            () => resolve(uploadTask.snapshot)
        );
    });
    console.log("here 3");

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Download URL:", downloadURL);
    return downloadURL;
}

// start recording 
  const startRecording = () => {
    recorder.current.start().then(() => {
    setInputText("");
    setRecordedSpeech("");
    setRecording(true);
    recognition.start();
      setIsInUse(true)
    })
  }

// stop recording 
  const stopRecording = () => {
  recorder.current
    .stop()
    .getMp3()
    .then(([buffer, blob]) => {
      const file = new File(buffer, "audio.mp3", {
        type: blob.type,
        lastModified: Date.now(),
      });
      const newBlobUrl = URL.createObjectURL(file);
      console.log("here");
      setMessages((messages) => {
        console.log(messages);
        return [...messages, { type: "audio", bloburl: newBlobUrl }];
      });
      callVoice(file);

      setRecording(false);
      recognition.stop();
      console.log("sending to server");
      handleSendSpeech();
      console.log("sent to server");
      uploadVoiceRecording(blob); // Pass the blob object here
    })
    .catch((e) => console.log(e));
};

  
  
    const handleSendSpeech = () => {
    axios
    // make changes here in the api if general or storychain or gamechain 
      .post("http://127.0.0.1:8000/gamechain", { story:story ,  speech: recordedSpeech ,question: question })
      .then((response) => {
        console.log("Server Response:", response.data.response);
        //handleServerResponse(response.data.response);
        question= response.data.response ;
        ttsget();
        setResponse(response.data.response);
       
      })
      .catch((error) => console.error("Error:", error));
  };

  const handleInputChange = (event) => {
    setInputText(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && inputText.trim() !== '' && !isLoading && !isInUse) {
      event.preventDefault();
      setIsInUse(true)
      setMessages((messages) => [...messages, {type: "text", text: inputText}]);
      callText(inputText)
      setInputText('');
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim() !== ''){
      setIsInUse(true)
      const newUserMessage = { type: "user", text: inputText };
      const newBotMessage = { type: "bot", text: response };
  
      setMessages([...messages, newUserMessage, newBotMessage]);
      callText(inputText)
      setInputText('');
    }
  };
  
  
    const game= () => {

    axios
    .get("http://127.0.0.1:8000/game")
    .then((response) => {
      console.log("Server Response:", response.data.response);
     // handleServerResponse(response.data.response);
      ttsget();
      setResponse(response.data.response);
    })
    .catch((error) => console.error("Error:", error));

  } ;
  

  const fetchStory = () => {
      console.log(story) ;

      axios
      .post("http://127.0.0.1:8000/storyqa", { story: story })
      .then((response) => {
        console.log("Server Response:", response.data.response);
       // handleServerResponse(response.data.response);
        question = response.data.response ; 
        ttsget();
        setResponse(response.data.response);
      })
      .catch((error) => console.error("Error:", error));
  };    
  
  
const ttsget = () => {
const formData = new FormData();
  formData.append("text", question); // Ensuring the field name "text" is used as expected by the backend.

  axios
    .post("http://127.0.0.1:8000/voice", formData, { responseType: 'blob' }) // Sending form data with responseType 'blob' to handle audio files
    .then((response) => {
      if (response.status === 200) {
        const audioBlob = response.data;
        const audioUrl = URL.createObjectURL(audioBlob);

        // Update the state with the new message including the audio URL
        setMessages((messages) => [
          ...messages,
          { type: 'audio-reply', bloburl: audioUrl },
        ]);

        // Playing the audio automatically
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        console.error("Server responded with an error:", response.status);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};


  return (
    <div className="chat-box">
        {/* <div className= "cues">
          <button onClick={fetchStory}>kahaani samjh may a gai? quiz</button>
          <button onClick={game}> storytelling game</button>

        </div> */}

      <div className="message-history">
        {messages.map((message, index) => {
            if (message.type === 'text'){
              return <div key={index} className="message-box">{message.text}</div>
            } else if (message.type === 'reply') {
              return <div key={index} className="reply-box">{message.text}</div>
            } else if (message.type === 'audio') {
              return <audio key={index} className="audio-box" ref={audioPlayer} src={message.bloburl} controls='controls'/>
            } else if (message.type === 'audio-reply') {
              return <audio key={index} className="audio-reply-box" ref={audioPlayer} src={message.bloburl} controls='controls'/>
            }
        })}
      </div>

      <div className='text-box'>
        <textarea
          ref={textareaRef}
          placeholder=" ادھر لکھیں۔۔۔۔"
          className="input-box"
          value={inputText}
          rows={1}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
        />

      <div className='buttons-container'>

      <button className="send-button" onClick={() => handleSendMessage()} disabled={isLoading || isInUse}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 16 16" 
          fill="none"
          class="h-4 w-4 m-1 md:m-0"
          stroke-width="2">
            <path 
              d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z" 
              fill={isInUse ? '#808080' : 'currentColor'}
            />
        </svg>
      </button>

      <button className="record-button" onClick={isInUse ? stopRecording : startRecording} disabled={isLoading}>
        <svg 
          width="20px" 
          height="20px"
          viewBox="0 0 24 24" 
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
            <path 
              fill-rule="evenodd" 
              clip-rule="evenodd" 
              d="M8 6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6V11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11V6Z" fill={isInUse ? '#455947' : '#455947'}
            />
            <path 
              d="M5 9C5.55228 9 6 9.44772 6 10V11C6 14.3137 8.68629 17 12 17C15.3137 17 18 14.3137 18 11V10C18 9.44772 18.4477 9 19 9C19.5523 9 20 9.44772 20 10V11C20 15.0803 16.9453 18.4471 12.9981 18.9383C12.9994 18.9587 13 18.9793 13 19V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V19C11 18.9793 11.0006 18.9587 11.0019 18.9383C7.05466 18.4471 4 15.0803 4 11V10C4 9.44772 4.44772 9 5 9Z" 
              fill={isInUse ? '#455947' : '#455947'}
            />
        </svg>
      </button>

      </div>
      
      </div>



    </div>
  );
};

export default ChatBox;
