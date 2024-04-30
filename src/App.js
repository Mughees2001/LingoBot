import './App.css';
import Chatbox from './Chatbox'
import anim from './anim.mp4'
import newLogo from './newlogo.png'
import firebase from './Chatbox/firebase';
import StoryGenerator from './StoryGenerator'; 

function App() {

  return (

    <div className="main">
      
      <div className="navbar">

        <img src= {newLogo} alt="BaatBot Logo" className="navbar-logo"/>

        <div className="navbar-links">
          <a href="#">Chat with LingoBot!</a>
          <a href="#">Give Feedback</a>
        </div>
    
        <button className="contact-btn">Contact Us</button>

      </div>

      <div className="main-content">

        <div className='animation-column'>
        <StoryGenerator />
          
          </div>

        <div className="chat-column">

            <Chatbox />

        </div>

      </div> 

    </div>

  );


}

export default App;
