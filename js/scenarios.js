const mixButton = document.getElementById('mixButton');
const chatas = document.getElementById('chatas');
const olah = document.getElementById('olah');
const birdsContainer = document.getElementById('birdsContainer');
const resultsSection = document.getElementById('resultsSection');

mixButton.addEventListener('click', function() {
    mixButton.disabled = true;
    
    // Move birds to center
    chatas.classList.add('moving-to-center-left');
    olah.classList.add('moving-to-center-right');
    
    // Fade out labels as they move
    chatas.querySelector('.bird-label').classList.add('fading');
    olah.querySelector('.bird-label').classList.add('fading');
    
    // After they meet (1s), move them back
    setTimeout(() => {
        chatas.classList.remove('moving-to-center-left');
        chatas.classList.add('moving-back-left');
        olah.classList.remove('moving-to-center-right');
        olah.classList.add('moving-back-right');
        
        // Show question marks as they separate
        chatas.querySelector('.bird-question').classList.add('show');
        olah.querySelector('.bird-question').classList.add('show');
    }, 1000);
    
    // Show results after they've separated (2s total)
    setTimeout(() => {
        resultsSection.classList.add('show');
    }, 2000);
});