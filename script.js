// DOM Elements
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const progressBar = document.getElementById('progress');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const studyTimeInput = document.getElementById('study-time');
const breakTimeInput = document.getElementById('break-time');
const subjectInput = document.getElementById('subject');
const soundButtons = document.querySelectorAll('.sound-btn');
const volumeSlider = document.getElementById('volume');
const totalSessionsDisplay = document.getElementById('total-sessions');
const totalMinutesDisplay = document.getElementById('total-minutes');
const currentStreakDisplay = document.getElementById('current-streak');

// Timer variables
let timer;
let isRunning = false;
let isPaused = false;
let isBreak = false;
let totalSeconds = 25 * 60;
let elapsedSeconds = 0;
let studyTime = 25;
let breakTime = 5;
let currentSound = null;

// Stats variables
let stats = {
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    lastStudyDate: null
};

// Load stats from local storage
function loadStats() {
    const savedStats = localStorage.getItem('studyTimerStats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
        
        // Check if the streak should be reset (no study yesterday)
        const today = new Date().toDateString();
        const lastStudy = stats.lastStudyDate ? new Date(stats.lastStudyDate).toDateString() : null;
        
        if (lastStudy) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (lastStudy !== today && lastStudy !== yesterdayString) {
                stats.currentStreak = 0;
            }
        }
        
        updateStatsDisplay();
    }
}

// Save stats to local storage
function saveStats() {
    localStorage.setItem('studyTimerStats', JSON.stringify(stats));
}

// Update stats display
function updateStatsDisplay() {
    totalSessionsDisplay.textContent = stats.totalSessions;
    totalMinutesDisplay.textContent = stats.totalMinutes;
    currentStreakDisplay.textContent = stats.currentStreak;
}

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
        minutes: mins < 10 ? '0' + mins : mins,
        seconds: secs < 10 ? '0' + secs : secs
    };
}

// Update timer display
function updateDisplay() {
    const time = formatTime(totalSeconds - elapsedSeconds);
    minutesDisplay.textContent = time.minutes;
    secondsDisplay.textContent = time.seconds;
    
    // Update progress bar
    const progress = (elapsedSeconds / totalSeconds) * 100;
    progressBar.style.width = `${progress}%`;
}

// Start the timer
function startTimer() {
    if (!isRunning) {
        // Update total seconds based on input values when starting
        if (!isPaused) {
            studyTime = parseInt(studyTimeInput.value, 10) || 25;
            breakTime = parseInt(breakTimeInput.value, 10) || 5;
            totalSeconds = (isBreak ? breakTime : studyTime) * 60;
            elapsedSeconds = 0;
            updateDisplay();
        }
        
        isRunning = true;
        isPaused = false;
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timer = setInterval(() => {
            elapsedSeconds++;
            
            if (elapsedSeconds >= totalSeconds) {
                // Timer completed
                clearInterval(timer);
                isRunning = false;
                
                if (!isBreak) {
                    // Study session completed
                    stats.totalSessions++;
                    stats.totalMinutes += studyTime;
                    
                    // Update streak
                    const today = new Date().toDateString();
                    if (stats.lastStudyDate !== today) {
                        stats.currentStreak++;
                        stats.lastStudyDate = today;
                    }
                    
                    saveStats();
                    updateStatsDisplay();
                    
                    // Switch to break
                    isBreak = true;
                    totalSeconds = breakTime * 60;
                    playNotificationSound();
                    alert("Study session completed! Time for a break.");
                } else {
                    // Break completed
                    isBreak = false;
                    totalSeconds = studyTime * 60;
                    playNotificationSound();
                    alert("Break time over! Ready to study again?");
                }
                
                elapsedSeconds = 0;
                updateDisplay();
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            } else {
                updateDisplay();
            }
        }, 1000);
    }
}

// Pause the timer
function pauseTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        isPaused = true;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
}

// Reset the timer
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    isBreak = false;
    
    studyTime = parseInt(studyTimeInput.value, 10) || 25;
    totalSeconds = studyTime * 60;
    elapsedSeconds = 0;
    
    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Play notification sound
function playNotificationSound() {
    const audio = new Audio('https://soundbible.com/grab.php?id=2156&type=mp3');
    audio.volume = volumeSlider.value / 100;
    audio.play();
}

// Handle ambient sounds
function handleSoundSelection(event) {
    const selectedSound = event.target.dataset.sound;
    
    // Remove active class from all buttons
    soundButtons.forEach(btn => btn.classList.remove('active'));
    
    // Stop current sound if playing
    if (currentSound) {
        currentSound.pause();
        currentSound = null;
    }
    
    // If selected something other than "none"
    if (selectedSound !== 'none') {
        event.target.classList.add('active');
        
        // Create appropriate sound based on selection
        let soundUrl;
        switch (selectedSound) {
            case 'rain':
                soundUrl = 'https://soundbible.com/grab.php?id=2065&type=mp3';
                break;
            case 'forest':
                soundUrl = 'https://soundbible.com/grab.php?id=1818&type=mp3';
                break;
            case 'cafe':
                soundUrl = 'https://soundbible.com/grab.php?id=2056&type=mp3';
                break;
        }
        
        if (soundUrl) {
            currentSound = new Audio(soundUrl);
            currentSound.loop = true;
            currentSound.volume = volumeSlider.value / 100;
            currentSound.play();
        }
    }
}

// Update volume
function updateVolume() {
    if (currentSound) {
        currentSound.volume = volumeSlider.value / 100;
    }
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
soundButtons.forEach(btn => btn.addEventListener('click', handleSoundSelection));
volumeSlider.addEventListener('input', updateVolume);

// Input validation
studyTimeInput.addEventListener('change', () => {
    if (!isRunning && !isPaused) {
        studyTime = parseInt(studyTimeInput.value, 10) || 25;
        if (!isBreak) {
            totalSeconds = studyTime * 60;
            updateDisplay();
        }
    }
});

breakTimeInput.addEventListener('change', () => {
    if (!isRunning && !isPaused) {
        breakTime = parseInt(breakTimeInput.value, 10) || 5;
        if (isBreak) {
            totalSeconds = breakTime * 60;
            updateDisplay();
        }
    }
});

// Initialize
loadStats();
updateDisplay();