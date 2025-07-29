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
    const backgroundSelector = document.querySelector('.background-selector');
    
    // Hide notes by default
    notesContainer.style.display = 'none';
    let notesVisible = false;

    // Function to handle mobile layout changes
    function handleMobileLayout() {
        // No JavaScript DOM manipulation needed - using CSS only
    }
    
    // Handle initial layout
    handleMobileLayout();
    
    // Handle window resize
    window.addEventListener('resize', handleMobileLayout);

    // Set initial background
    backgroundDiv.style.backgroundImage = `url(${backgroundSelect.value})`;

    // Handle background change
    backgroundSelect.addEventListener('change', (e) => {
        backgroundDiv.style.backgroundImage = `url(${e.target.value})`;
    });

    let draggedPlanet = null;
    let isDraggingFromSidebar = false;
    let draggedElement = null;

    // Create a helper function to get coordinates from mouse or touch events
    const getEventCoordinates = (e) => {
        // For touch events, use changedTouches for touchend events since touches array is empty
        if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        // Fallback to mouse coordinates, with validation
        const x = e.clientX || 0;
        const y = e.clientY || 0;
        return { x, y };
    };

    // Handle planet dragging from selector (both mouse and touch)
    planetSelector.addEventListener('mousedown', handleSidebarDragStart);
    planetSelector.addEventListener('touchstart', handleSidebarDragStart, { passive: false });

    function handleSidebarDragStart(e) {
        const planet = e.target.closest('.draggable');
        if (!planet) return;

        e.preventDefault();
        isDraggingFromSidebar = true;
        
        // Create a dragged element that follows the cursor/finger
        draggedElement = planet.cloneNode(true);
        draggedElement.style.position = 'fixed';
        draggedElement.style.pointerEvents = 'none';
        draggedElement.style.zIndex = '9999';
        draggedElement.style.opacity = '0.8';
        draggedElement.style.width = '42px';
        draggedElement.style.height = '42px';
        document.body.appendChild(draggedElement);

        const coords = getEventCoordinates(e);
        updateDraggedElementPosition(coords.x, coords.y);

        // Add move and end event listeners
        if (e.type === 'touchstart') {
            document.addEventListener('touchmove', handleSidebarDragMove, { passive: false });
            document.addEventListener('touchend', handleSidebarDragEnd);
        } else {
            document.addEventListener('mousemove', handleSidebarDragMove);
            document.addEventListener('mouseup', handleSidebarDragEnd);
        }
    }

    function updateDraggedElementPosition(x, y) {
        if (draggedElement) {
            draggedElement.style.left = (x - 21) + 'px';
            draggedElement.style.top = (y - 21) + 'px';
        }
    }

    function handleSidebarDragMove(e) {
        if (!isDraggingFromSidebar || !draggedElement) return;
        e.preventDefault();

        const coords = getEventCoordinates(e);
        updateDraggedElementPosition(coords.x, coords.y);
    }

    function handleSidebarDragEnd(e) {
        if (!isDraggingFromSidebar || !draggedElement) return;
        e.preventDefault();

        const coords = getEventCoordinates(e);
        
        // Validate coordinates before using elementFromPoint
        if (isNaN(coords.x) || isNaN(coords.y) || !isFinite(coords.x) || !isFinite(coords.y)) {
            console.warn('Invalid coordinates for drop detection');
            cleanupSidebarDrag();
            return;
        }
        
        // Check if we're dropping over the planet container
        let elementAtPoint = null;
        try {
            elementAtPoint = document.elementFromPoint(coords.x, coords.y);
        } catch (error) {
            console.warn('Error with elementFromPoint:', error);
            cleanupSidebarDrag();
            return;
        }
        
        const isOverPlanetContainer = elementAtPoint && (planetContainer.contains(elementAtPoint) || elementAtPoint === planetContainer);
        
        if (isOverPlanetContainer) {
            // Create new planet in the container
            const planetSrc = draggedElement.src;
            const newPlanet = document.createElement('img');
            newPlanet.src = planetSrc;
            newPlanet.className = 'dragged-planet';
            newPlanet.draggable = true;
            
            // Position it relative to the container
            const rect = planetContainer.getBoundingClientRect();
            const x = coords.x - rect.left - 21;
            const y = coords.y - rect.top - 21;
            
            newPlanet.style.left = `${x}px`;
            newPlanet.style.top = `${y}px`;
            
            // Apply drag handlers to the new planet
            addDragHandlers(newPlanet);
            
            // Add removal handlers
            addRemovalHandlers(newPlanet);
            
            planetContainer.appendChild(newPlanet);
        }

        cleanupSidebarDrag();
    }
    
    function cleanupSidebarDrag() {
        // Clean up
        if (draggedElement) {
            document.body.removeChild(draggedElement);
            draggedElement = null;
        }
        isDraggingFromSidebar = false;

        // Remove event listeners
        document.removeEventListener('mousemove', handleSidebarDragMove);
        document.removeEventListener('mouseup', handleSidebarDragEnd);
        document.removeEventListener('touchmove', handleSidebarDragMove);
        document.removeEventListener('touchend', handleSidebarDragEnd);
    }

    // Legacy support for HTML5 drag and drop (desktop browsers)
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
            draggedPlanet.remove();
        }
        draggedPlanet = null;
    });

    planetContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const planetSrc = e.dataTransfer.getData('text/plain');
        
        // Only handle this if it's not from our custom drag system
        if (!isDraggingFromSidebar && planetSrc) {
            // Create new planet - no duplicate checking, unlimited placement allowed
            const newPlanet = document.createElement('img');
            newPlanet.src = planetSrc;
            newPlanet.className = 'dragged-planet';
            newPlanet.draggable = true; // Make it draggable
            
            // Position it where the mouse was dropped
            const rect = planetContainer.getBoundingClientRect();
            const x = e.clientX - rect.left - 21; // Use fixed offset for initial placement
            const y = e.clientY - rect.top - 21;
            
            newPlanet.style.left = `${x}px`;
            newPlanet.style.top = `${y}px`;
            
            // Apply drag handlers to the new planet
            addDragHandlers(newPlanet);
            
            // Add removal handlers
            addRemovalHandlers(newPlanet);
            
            planetContainer.appendChild(newPlanet);
        }
    });
    
    // Handle dragging of placed planets (mouse and touch)
    function addDragHandlers(planet) {
        let planetIsDragging = false;
        let planetDragHandlers = null;
        
        // Remove any existing handlers to prevent duplicates
        if (planet._dragHandlersAdded) {
            return;
        }
        planet._dragHandlersAdded = true;
        
        function handlePlanetDragStart(e, eventType) {
            // Prevent if we're already dragging from sidebar
            if (isDraggingFromSidebar) {
                e.preventDefault();
                return;
            }
            
            if (eventType === 'mouse' && e.button !== 0) return; // Only left mouse button
            e.preventDefault(); // Prevent default drag behavior
            
            planet.style.cursor = 'grabbing';
            planet.style.zIndex = '1000'; // Bring to front while dragging
            planetIsDragging = false;
            
            // Get initial coordinates based on event type
            const startCoords = getEventCoordinates(e);
            
            const move = (e) => {
                e.preventDefault(); // Prevent default behavior
                
                // Get current coordinates based on event type
                const currentCoords = getEventCoordinates(e);
                
                // Only consider it a drag after moving a bit
                if (!planetIsDragging && 
                    (Math.abs(currentCoords.x - startCoords.x) > 5 || 
                     Math.abs(currentCoords.y - startCoords.y) > 5)) {
                    planetIsDragging = true;
                    // Disable native drag while dragging
                    planet.draggable = false;
                }
                
                if (planetIsDragging) {
                    const rect = planetContainer.getBoundingClientRect();
                    const x = currentCoords.x - rect.left - planet.width / 2;
                    const y = currentCoords.y - rect.top - planet.height / 2;
                    
                    planet.style.left = `${x}px`;
                    planet.style.top = `${y}px`;
                }
            };
            
            const up = (e) => {
                e.preventDefault(); // Prevent default behavior
                
                // Remove appropriate event listeners based on type
                if (eventType === 'touch') {
                    document.removeEventListener('touchmove', move);
                    document.removeEventListener('touchend', up);
                } else {
                    document.removeEventListener('mousemove', move);
                    document.removeEventListener('mouseup', up);
                }
                
                planet.style.cursor = 'move';
                planet.style.zIndex = 'auto'; // Reset z-index
                // Re-enable native drag for removal functionality
                planet.draggable = true;
                planetIsDragging = false;
            };
            
            // Add appropriate event listeners based on type
            if (eventType === 'touch') {
                document.addEventListener('touchmove', move, { passive: false });
                document.addEventListener('touchend', up);
            } else {
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
            }
        }
        
        // Mouse events for desktop
        const mouseDownHandler = (e) => handlePlanetDragStart(e, 'mouse');
        planet.addEventListener('mousedown', mouseDownHandler);

        // Touch events for mobile
        const touchStartHandler = (e) => handlePlanetDragStart(e, 'touch');
        planet.addEventListener('touchstart', touchStartHandler, { passive: false });
        
        // Store handlers for potential cleanup
        planet._dragHandlers = {
            mousedown: mouseDownHandler,
            touchstart: touchStartHandler
        };
    }

    // Handle removal of planets (drag to sidebar)
    function addRemovalHandlers(planet) {
        // Handle drag start for removal - with additional cleanup
        planet.addEventListener('dragstart', (e) => {
            draggedPlanet = e.target;
            // Set a transparent drag image to prevent visual artifacts
            const emptyImg = new Image();
            emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
            e.dataTransfer.setDragImage(emptyImg, 0, 0);
        });

        // Prevent context menu on planets to avoid interference
        planet.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Prevent text selection on planets
        planet.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
    }
    
    // Handle Clear All button
    clearAllBtn.addEventListener('click', () => {
        // Clear all planets
        planetContainer.innerHTML = '';
        
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