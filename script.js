document.addEventListener('DOMContentLoaded', () => {
    const backgroundSelect = document.getElementById('backgroundSelect');
    const backgroundDiv = document.getElementById('background');
    const planetContainer = document.getElementById('planetContainer');
    const planetSelector = document.querySelector('.planet-selector');
    const sidebar = document.querySelector('.sidebar');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const exportImageBtn = document.getElementById('exportImageBtn');
    const mainContent = document.querySelector('.main-content');
    const notesArea = document.getElementById('notesArea');
    const toggleNotesBtn = document.getElementById('toggleNotesBtn');
    const notesContainer = document.querySelector('.notes-container');
    
    // Hide notes by default
    notesContainer.style.display = 'none';
    let notesVisible = false;

    // Set initial background
    backgroundDiv.style.backgroundImage = `url(${backgroundSelect.value})`;

    // Handle background change
    backgroundSelect.addEventListener('change', (e) => {
        backgroundDiv.style.backgroundImage = `url(${e.target.value})`;
    });

    // Track active planets and dragging state
    const activePlanets = new Set();
    let isDragging = false;
    let draggedPlanet = null;

    // Handle planet dragging from selector
    planetSelector.addEventListener('dragstart', (e) => {
        const planet = e.target.closest('.draggable');
        if (planet) {
            e.dataTransfer.setData('text/plain', planet.src);
            e.dataTransfer.setDragImage(planet, 0, 0);
        }
    });

    planetContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    // Allow dropping in sidebar for removal
    sidebar.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    sidebar.addEventListener('drop', (e) => {
        e.preventDefault();
        // If we're dropping a planet from the container to the sidebar, remove it
        if (draggedPlanet && draggedPlanet.parentNode === planetContainer) {
            const planetSrc = draggedPlanet.src;
            draggedPlanet.remove();
            activePlanets.delete(planetSrc);
        }
        draggedPlanet = null;
    });

    planetContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const planetSrc = e.dataTransfer.getData('text/plain');
        
        // Only create new planets from the selector
        if (activePlanets.has(planetSrc)) {
            return; // Don't create a duplicate
        }

        const newPlanet = document.createElement('img');
        newPlanet.src = planetSrc;
        newPlanet.className = 'dragged-planet';
        newPlanet.draggable = true; // Make it draggable
        
        // Position it where the mouse was dropped
        const rect = planetContainer.getBoundingClientRect();
        const x = e.clientX - rect.left - 25; // Use fixed offset for initial placement
        const y = e.clientY - rect.top - 25;
        
        newPlanet.style.left = `${x}px`;
        newPlanet.style.top = `${y}px`;
        
        activePlanets.add(planetSrc);

        // Handle dragging of placed planets
        newPlanet.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left mouse button
            
            const planet = e.target;
            planet.style.cursor = 'grabbing';
            isDragging = false;
            
            const startX = e.clientX;
            const startY = e.clientY;
            
            const move = (e) => {
                // Only consider it a drag after moving a bit
                if (!isDragging && 
                    (Math.abs(e.clientX - startX) > 5 || 
                     Math.abs(e.clientY - startY) > 5)) {
                    isDragging = true;
                }
                
                if (isDragging) {
                    const rect = planetContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left - planet.width / 2;
                    const y = e.clientY - rect.top - planet.height / 2;
                    
                    planet.style.left = `${x}px`;
                    planet.style.top = `${y}px`;
                }
            };
            
            const up = () => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
                planet.style.cursor = 'move';
                isDragging = false;
            };
            
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });

        // Handle drag start for removal
        newPlanet.addEventListener('dragstart', (e) => {
            draggedPlanet = e.target;
        });

        planetContainer.appendChild(newPlanet);
    });
    
    // Handle Clear All button
    clearAllBtn.addEventListener('click', () => {
        // Clear all planets
        planetContainer.innerHTML = '';
        
        // Reset the activePlanets set
        activePlanets.clear();
        
        // Reset background to Empty
        backgroundSelect.value = 'Backgrounds/Empty.png';
        backgroundDiv.style.backgroundImage = `url(${backgroundSelect.value})`;
        
        // Clear the notes
        notesArea.value = '';
    });
    
    // Handle toggle notes button
    toggleNotesBtn.addEventListener('click', () => {
        notesVisible = !notesVisible;
        notesContainer.style.display = notesVisible ? 'block' : 'none';
    });

    // Handle Export Image button
    exportImageBtn.addEventListener('click', () => {
        // Temporarily hide the buttons for the screenshot
        clearAllBtn.style.display = 'none';
        exportImageBtn.style.display = 'none';
        
        // Save the notes content and temporarily hide if empty
        const notesContent = notesArea.value;
        const notesContainer = document.querySelector('.notes-container');
        
        // Only include notes in the export if the user has written something
        if (!notesContent.trim()) {
            notesContainer.style.display = 'none';
        }
        
        // Make sure all elements in the scene are accounted for
        const footerCredit = document.querySelector('.footer-credit');
        const appTitle = document.querySelector('.app-title');
        
        // Ensure the footer and title are visible in the export
        if (footerCredit) footerCredit.style.zIndex = '1000';
        if (appTitle) appTitle.style.zIndex = '1000';
        
        // Use html2canvas to capture the main content area
        html2canvas(mainContent, {
            backgroundColor: null,
            useCORS: true,
            allowTaint: true,
            scale: 2, // Higher quality
            logging: false // Reduce console output
        }).then(canvas => {
            // Create a data URL from the canvas
            const dataURL = canvas.toDataURL('image/png');
            
            // Create a temporary link and trigger the download
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'astrobuilder_io.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show the buttons again
            setTimeout(() => {
                clearAllBtn.style.display = 'block';
                exportImageBtn.style.display = 'block';
                
                // Make sure the notes container is returned to its previous state
                notesContainer.style.display = notesVisible ? 'block' : 'none';
            }, 100);
        });
    });
});