const mixButton = document.getElementById('mixButton');
const chatas = document.getElementById('chatas');
const olah = document.getElementById('olah');
const birdsContainer = document.getElementById('birdsContainer');
const resultsSection = document.getElementById('resultsSection');

mixButton.addEventListener('click', function() {
    // Disable button during animation
    mixButton.disabled = true;
    
    // Add spinning animations
    chatas.classList.add('spinning-left');
    olah.classList.add('spinning-right');
    
    // Wait for animation to complete (2 seconds)
    setTimeout(() => {
        // Hide birds and button
        birdsContainer.classList.add('hidden');
        mixButton.classList.add('hidden');
        
        // Show results
        resultsSection.classList.add('show');
    }, 2000);
});