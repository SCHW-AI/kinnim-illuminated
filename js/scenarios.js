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


// Generate 25 chatas birds
continueButton.addEventListener('click', function() {
    phase2Container.classList.add('show');
    continueButton.style.display = 'none';
    
    // Create 8×5 grid = 40 positions
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
            const birdWrapper = document.createElement('div');
            birdWrapper.className = 'bird-wrapper';
            
            // Position (2,2) is empty for olah to slide into (0-indexed, so row 2 col 2 = visual 3,3)
            // Position (7,2) has the olah (0-indexed, so row 2 col 7 = visual 3,8)
            // Columns 0-4 rows 0-4 (except 2,2) have chatas
            // Rest are invisible
            
            if (col === 7 && row === 2) {
                // This is the olah position
                birdWrapper.id = 'gridOlah';
                const birdImg = document.createElement('img');
                birdImg.src = '../images/bird.png';
                birdImg.alt = 'עולה';
                birdImg.className = 'bird-image';
                
                const birdLabel = document.createElement('div');
                birdLabel.className = 'bird-label';
                birdLabel.textContent = 'עולה';
                
                const birdQuestion = document.createElement('div');
                birdQuestion.className = 'bird-question';
                birdQuestion.textContent = '?';
                
                birdWrapper.appendChild(birdImg);
                birdWrapper.appendChild(birdLabel);
                birdWrapper.appendChild(birdQuestion);
            } else if (col <= 4 && !(col === 2 && row === 2)) {
                // Chatas in first 5 columns, except the gap at (2,2)
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
            } else {
                // Invisible placeholder
                birdWrapper.classList.add('invisible');
            }
            
            manyChataosContainer.appendChild(birdWrapper);
        }
    }
    
    phase2Container.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

mixManyButton.addEventListener('click', function() {
    mixManyButton.disabled = true;
    
    // Move the olah into the gap
    const gridOlah = document.getElementById('gridOlah');
    gridOlah.classList.add('joining');
    
    // Fade out all labels
    setTimeout(() => {
        const allLabels = document.querySelectorAll('.phase2-layout .bird-label');
        allLabels.forEach(label => label.classList.add('fading'));
    }, 500);
    
    // Show all question marks
    setTimeout(() => {
        const allQuestions = document.querySelectorAll('.phase2-layout .bird-question');
        allQuestions.forEach(q => q.classList.add('show'));
    }, 2000);
    
    // Show results
    setTimeout(() => {
        results2Section.classList.add('show');
    }, 2500);
});