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

const continueButton = document.getElementById('continueButton');
const phase2Section = document.getElementById('phase2Section');
const phase2Container = document.getElementById('phase2Container');
const manyBirdsContainer = document.getElementById('manyBirdsContainer');
const mixManyButton = document.getElementById('mixManyButton');
const results2Section = document.getElementById('results2Section');

// Show continue button after first results
setTimeout(() => {
    resultsSection.classList.add('show');
    setTimeout(() => {
        phase2Section.classList.add('show');
    }, 500);
}, 2000);

// Generate 25 chatas birds
continueButton.addEventListener('click', function() {
    phase2Container.classList.add('show');
    continueButton.style.display = 'none';
    
    // Create 25 chatas birds
    for (let i = 0; i < 25; i++) {
        const birdWrapper = document.createElement('div');
        birdWrapper.className = 'bird-wrapper';
        
        const birdImg = document.createElement('img');
        birdImg.src = '../images/bird.png';
        birdImg.alt = 'חטאת';
        birdImg.className = 'bird-image';
        
        const birdLabel = document.createElement('div');
        birdLabel.className = 'bird-label';
        birdLabel.textContent = 'חטאת';
        
        const birdQuestion = document.createElement('div');
        birdQuestion.className = 'bird-question';
        birdQuestion.textContent = '?';
        
        birdWrapper.appendChild(birdImg);
        birdWrapper.appendChild(birdLabel);
        birdWrapper.appendChild(birdQuestion);
        manyChataosContainer.appendChild(birdWrapper);
    }
    
    phase2Container.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

mixManyButton.addEventListener('click', function() {
    mixManyButton.disabled = true;
    
    // Move the olah into the group
    const singleOlah = document.getElementById('singleOlah');
    singleOlah.classList.add('joining');
    
    // Fade out all labels as olah moves
    setTimeout(() => {
        const allLabels = document.querySelectorAll('#manyChataosContainer .bird-label, #singleOlah .bird-label');
        allLabels.forEach(label => label.classList.add('fading'));
    }, 500);
    
    // Show all question marks
    setTimeout(() => {
        const allQuestions = manyChataosContainer.querySelectorAll('.bird-question');
        allQuestions.forEach(q => q.classList.add('show'));
        singleOlah.querySelector('.bird-question').classList.add('show');
    }, 2000);
    
    // Show results
    setTimeout(() => {
        results2Section.classList.add('show');
    }, 2500);
});