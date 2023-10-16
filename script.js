let mediaRecorder;
let recordedChunks = [];
let timerInterval;
let i=0;
// Function to start recording the audio
async function startRecording() {
  console.log("startRecording called.");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = function (event) {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    mediaRecorder.start();
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
    startTimer();
  } catch (error) {
    console.error('Microphone access denied or error:', error);
  }
}

function stopRecording() {
  console.log("stopRecording called.");

  return new Promise((resolve) => {
    // Clear the interval and update UI
    clearInterval(timerInterval);
    updateTimerDisplay(0);
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;

    // Set up the mediaRecorder.onstop event handler
    mediaRecorder.onstop = function () {
      // Display the recorded audio
      displayNewRecordedAudio();

      // Use Promise to wait for sendAudioToBackend to complete
      sendAudioToBackend().then(() => {
        // Clear recordedChunks for the next recording
        recordedChunks = [];
        resolve(); // Resolve the promise after everything is done
      });
    };

    // Stop the media recorder
    mediaRecorder.stop();
  });
}


  

// Function to display the real-time timer
function startTimer() {
  console.log("startTimer called.");
  let startTime = Date.now();
  timerInterval = setInterval(function () {
    let currentTime = Date.now();
    let elapsedTime = Math.floor((currentTime - startTime) / 1000); // in seconds
    updateTimerDisplay(elapsedTime);
  }, 1000); // Update every 1 second
}

// Function to update the timer display
function updateTimerDisplay(timeInSeconds) {
  console.log("updateTimerDisplay called.");
  let minutes = Math.floor(timeInSeconds / 60);
  let seconds = timeInSeconds % 60;
  document.getElementById('timerDisplay').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Function to display the audio player with the new recorded audio
function displayNewRecordedAudio() {
  console.log("displayNewRecordedAudio called.");
  const blob = new Blob(recordedChunks, { type: 'audio/mpeg' }); // Change the type to 'audio/mpeg'
  const audioURL = URL.createObjectURL(blob);

  const audioPlayer = document.createElement('audio');
  audioPlayer.controls = true;
  audioPlayer.src = audioURL;

  const audioContainer = document.getElementById('audioContainer');
  audioContainer.innerHTML = '';
  audioContainer.appendChild(audioPlayer);
}

async function sendAudioToBackend() {
  console.log("sendAudioToBackend called.");
  const audioBlob = new Blob(recordedChunks, { type: 'audio/mpeg' }); // Change the type to 'audio/mpeg'
  const formData = new FormData();
  formData.append('file', audioBlob, 'recorded_audio.mp3');

  // Get the selected target language
  const targetLanguage = document.getElementById('target-language').value;
  formData.append('target_language', targetLanguage);

  try {
    const response = await fetch('http://127.0.0.1:5000/upload', {
      method: 'POST',
      
      body: formData,
    });
    if (!response.ok) {
      // Handle error response
      const errorMessage = await response.text();
      console.error(`Failed to upload the audio. Status: ${response.status}, Message: ${errorMessage}`);
    } else {
      const data = await response.json();
      // Display the translation result on the webpage
      console.log("Translation Result:", data.translation);
      const translationResultDiv =  document.getElementById('translation-result');
      translationResultDiv.textContent = JSON.stringify(data.translation);
    }

  } catch (error) {
    console.error('Error:', error);
  }

  console.log('Sending the recorded audio to the backend...');
}


// Event listeners for buttons
document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);
document.getElementById('stopRecording').disabled = true;
