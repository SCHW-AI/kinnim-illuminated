const mixButton = document.getElementById('mixButton');
const chatas = document.getElementById('chatas');
const olah = document.getElementById('olah');
const birdsContainer = document.getElementById('birdsContainer');
const resultsSection = document.getElementById('resultsSection');

mixButton.addEventListener('click', function() {
    mixButton.disabled = true;
    
    // Start spinning both birds
    chatas.classList.add('spinning-left');
    olah.classList.add('spinning-right');
    
    // Fade out labels after 0.5s
    setTimeout(() => {
        chatas.querySelector('.bird-label').classList.add('fading');
        olah.querySelector('.bird-label').classList.add('fading');
    }, 500);
    
    // After spin completes (3s), show question marks briefly
    setTimeout(() => {
        chatas.querySelector('.bird-question').classList.add('show');
        olah.querySelector('.bird-question').classList.add('show');
    }, 3000);
    
    // Then show explanation after another second
    setTimeout(() => {
        resultsSection.classList.add('show');
    }, 4000);
});