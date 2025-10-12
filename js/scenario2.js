const mixButton = document.getElementById('mixButton');
const kenStuma = document.getElementById('kenStuma');
const definedBird = document.getElementById('definedBird');
const resultsSection = document.getElementById('resultsSection');
const switchButton = document.getElementById('switchButton');
const olahCaseContainer = document.getElementById('olahCaseContainer');
const mixOlahButton = document.getElementById('mixOlahButton');
const results2Section = document.getElementById('results2Section');

mixButton.addEventListener('click', function() {
    mixButton.disabled = true;
    
    // Move ken and defined bird together
    kenStuma.classList.add('mixing');
    definedBird.classList.add('mixing');
    
    // Fade out the ken title and labels after they meet
    setTimeout(() => {
        kenStuma.querySelector('.ken-title').classList.add('fading');
        kenStuma.querySelector('.ken-subtitle').classList.add('fading');
        kenStuma.querySelectorAll('.dual-label').forEach(label => {
            label.classList.add('fading');
        });
        definedBird.querySelector('.bird-label').classList.add('fading');
        definedBird.querySelector('.defined-label').classList.add('fading');
        
        // Remove ken border
        kenStuma.classList.add('border-fading');
    }, 1000);
    
    // Show results after mixing
    setTimeout(() => {
        resultsSection.classList.add('show');
        switchButton.style.display = 'block';
    }, 2500);
});

switchButton.addEventListener('click', function() {
    olahCaseContainer.classList.add('show');
    switchButton.style.display = 'none';
    olahCaseContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

mixOlahButton.addEventListener('click', function() {
    mixOlahButton.disabled = true;
    
    const olahKen = olahCaseContainer.querySelector('.ken-container');
    const olahDefined = document.getElementById('definedOlah');
    
    // Mix animation
    olahKen.classList.add('mixing');
    olahDefined.classList.add('mixing');
    
    // Fade labels
    setTimeout(() => {
        olahKen.querySelector('.ken-title').classList.add('fading');
        olahKen.querySelector('.ken-subtitle').classList.add('fading');
        olahKen.querySelectorAll('.dual-label').forEach(label => {
            label.classList.add('fading');
        });
        olahDefined.querySelector('.bird-label').classList.add('fading');
        olahDefined.querySelector('.defined-label').classList.add('fading');
        
        olahKen.classList.add('border-fading');
    }, 1000);
    
    setTimeout(() => {
        results2Section.classList.add('show');
    }, 2500);
});