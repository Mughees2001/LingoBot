import React, { useState, useRef, useEffect } from 'react';
import MicRecorder from "mic-recorder-to-mp3";
import axios from "axios";
import playIcon from './play.svg'; 
import pauseIcon from './pause.svg'; 
import forwardIcon from './forward-10-seconds.svg'; 
import backwardIcon from './backward-10-seconds.svg';

const StoryGenerator = () => {
  const [storyText, setStoryText] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isInUse, setIsInUse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayer = useRef(null);
  const recorder = useRef(new MicRecorder({ bitRate: 128 }));

  const recognition = new window.webkitSpeechRecognition();
  recognition.interimResults = true;
  recognition.lang = "ur-PK";
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map(result => result[0].transcript).join("");
    setTranscribedText(transcript);
  };

  useEffect(() => {
    recorder.current = new MicRecorder({ bitRate: 128 });
  }, []);

  const handleSendSpeech = async () => {
    if (!transcribedText) return;
    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/story", { speech: transcribedText });
      setStoryText(response.data.response);
      ttsGet(response.data.response);
    } catch (error) {
      console.error("Error:", error);
      setStoryText("Failed to load the story. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const ttsGet = async (text) => {
    const formData = new FormData();
    formData.append("text", text);
    try {
      const response = await axios.post("http://127.0.0.1:8000/voice", formData, { responseType: 'blob' });
      const audioBlob = response.data;
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      audioPlayer.current.src = url;
      audioPlayer.current.onended = () => setIsPlaying(false);
    } catch (error) {
      console.error("Error fetching audio:", error);
    }
  };

  const startRecording = () => {
    recorder.current.start().then(() => {
      setIsInUse(true);
      recognition.start();
    }).catch(e => console.error(e));
  };

  const stopRecording = () => {
    recorder.current.stop().getMp3().then(([buffer, blob]) => {
      setIsInUse(false);
      recognition.stop();
      handleSendSpeech();
    }).catch(e => console.error(e));
  };

  const togglePlayPause = () => {
    if (audioPlayer.current.paused) {
      audioPlayer.current.play();
      setIsPlaying(true);
    } else {
      audioPlayer.current.pause();
      setIsPlaying(false);
    }
  };

  const rewindAudio = () => {
    audioPlayer.current.currentTime = Math.max(0, audioPlayer.current.currentTime - 10);
  };

  const forwardAudio = () => {
    audioPlayer.current.currentTime = Math.min(audioPlayer.current.duration, audioPlayer.current.currentTime + 10);
  };


  return (
    <div className="story-generator">
          <h1 className= "message-text" style={{ textAlign: 'center', fontSize: '24px' }}>قصہ گو</h1>
    
      <div className="story-container" style={{ height: '100%', overflow: 'auto', padding: '20px' }}>
        {storyText}
      </div>
      <audio ref={audioPlayer} controls hidden />
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <button onClick={rewindAudio} title="Rewind 10 seconds">
          <img src={backwardIcon} alt="Rewind 10 seconds" style={{ width: '24px', height: '24px' }} />
        </button>
        <button onClick={togglePlayPause} title={isPlaying ? "Pause" : "Play"}>
          <img src={isPlaying ? pauseIcon : playIcon} alt={isPlaying ? "Pause" : "Play"} style={{ width: '24px', height: '24px' }} />
        </button>
        <button onClick={forwardAudio} title="Forward 10 seconds">
          <img src={forwardIcon} alt="Forward 10 seconds" style={{ width: '24px', height: '24px' }} />
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
      {isInUse && <span>Listening...</span>}
    </div>
  );
};

export default StoryGenerator;

