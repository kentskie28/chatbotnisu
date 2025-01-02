document.addEventListener('DOMContentLoaded', () => {
    const rowsPerPage = 5;
    let allIntents = [];
    let currentPage = 1;

    // Fetch intents from API
    async function fetchIntents() {
        try {
            const response = await axios.get('/api/intents');
            allIntents = response.data;
            updateTable();
        } catch (error) {
            console.error('Error fetching intents:', error);
            alert('Failed to load intents.');
        }
    }

    // Update the table based on the current page
    function updateTable() {
        const tableBody = document.querySelector('#intents-table tbody');
        tableBody.innerHTML = '';

        const filteredIntents = filterIntents();
        const start = (currentPage - 1) * rowsPerPage;
        const paginatedIntents = filteredIntents.slice(start, start + rowsPerPage);

        paginatedIntents.forEach((intent, index) => {
            const globalIndex = allIntents.indexOf(intent); // Track the actual index in allIntents
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${intent.tag}</td>
                <td>${intent.patterns.join('; ')}</td>
                <td>${intent.responses.join('; ')}</td>
                <td>${intent.secondary_responses.join('; ')}</td>
                <td>${intent.context}</td>
                <td>${intent.suggestions.join('; ')}</td>
            `;
            row.dataset.globalIndex = globalIndex; // Store the index
            tableBody.appendChild(row);
        });

        setupPagination(filteredIntents.length);
    }

    // Filter intents based on search
    function filterIntents() {
        const searchQuery = document.querySelector('#search-bar').value.toLowerCase();
        return allIntents.filter((intent) =>
            intent.tag.toLowerCase().includes(searchQuery) ||
            intent.patterns.some((pattern) => pattern.toLowerCase().includes(searchQuery)) ||
            intent.responses.some((response) => response.toLowerCase().includes(searchQuery))
        );
    }

    // Setup pagination
    function setupPagination(totalRows) {
        const paginationElement = document.getElementById('pagination');
        paginationElement.innerHTML = '';

        const totalPages = Math.ceil(totalRows / rowsPerPage);

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.classList.toggle('active', i === currentPage);
            button.addEventListener('click', () => {
                currentPage = i;
                updateTable();
            });
            paginationElement.appendChild(button);
        }
    }

    // Edit button event
    const editButton = document.getElementById('edit-table');
    const saveButton = document.getElementById('save-table');

    editButton.addEventListener('click', () => {
        const cells = document.querySelectorAll('#intents-table tbody td');
        cells.forEach(cell => cell.setAttribute('contenteditable', 'true'));

        editButton.style.display = 'none';
        saveButton.style.display = 'inline-block';
    });

    // Save button event
    saveButton.addEventListener('click', async () => {
        const rows = document.querySelectorAll('#intents-table tbody tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const globalIndex = parseInt(row.dataset.globalIndex, 10);

            // Update intent in the global array
            allIntents[globalIndex] = {
                tag: cells[0].textContent.trim(),
                patterns: cells[1].textContent.split(';').map(p => p.trim()),
                responses: cells[2].textContent.split(';').map(r => r.trim()),
                secondary_responses: cells[3].textContent.split(';').map(sr => sr.trim()),
                context: cells[4].textContent.trim(),
                suggestions: cells[5].textContent.split(';').map(s => s.trim()),
            };
        });

        // Send updated data to the backend
        try {
            const response = await axios.post('/api/update_intents', { intents: allIntents });
            if (response.data.message) {
                alert('Intents updated successfully!');
            } else {
                alert('Failed to save changes.');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('An error occurred while saving changes.');
        }

        // Disable editing and reset buttons
        const cells = document.querySelectorAll('#intents-table tbody td');
        cells.forEach(cell => cell.setAttribute('contenteditable', 'false'));

        saveButton.style.display = 'none';
        editButton.style.display = 'inline-block';
    });

    // Event listener for search
    document.querySelector('#search-bar').addEventListener('input', () => {
        currentPage = 1;
        updateTable();
    });

    // Show the "Add New Intent" modal
    const addIntentButton = document.getElementById('add-intent');
    const addIntentModal = document.getElementById('add-intent-modal');
    const cancelAddIntentButton = document.getElementById('cancel-add-intent');
    const saveNewIntentButton = document.getElementById('save-new-intent');

    addIntentButton.addEventListener('click', () => {
        addIntentModal.style.display = 'block';
    });

    cancelAddIntentButton.addEventListener('click', () => {
        addIntentModal.style.display = 'none';
    });

    // Save new intent
    saveNewIntentButton.addEventListener('click', async () => {
        const newTag = document.getElementById('new-tag').value.trim();
        const newPatterns = document.getElementById('new-patterns').value.split(',').map(p => p.trim());
        const newResponses = document.getElementById('new-responses').value.split(',').map(r => r.trim());
        const newContext = document.getElementById('new-context').value.trim();
        const newSuggestions = document.getElementById('new-suggestions').value.split(',').map(s => s.trim());

        // Create a new intent object
        const newIntent = {
            tag: newTag,
            patterns: newPatterns,
            responses: newResponses,
            secondary_responses: [],
            context: newContext,
            suggestions: newSuggestions,
        };

        // Send the new intent to the backend
        try {
            const response = await axios.post('/api/add_intent', { intent: newIntent });
            if (response.data.message) {
                alert('Intent added successfully!');
                allIntents.push(newIntent);
                updateTable();
                addIntentModal.style.display = 'none'; // Close modal
            } else {
                alert('Failed to add intent.');
            }
        } catch (error) {
            console.error('Error adding intent:', error);
            alert('An error occurred while adding the intent.');
        }
    });

    // Initial data fetch
    fetchIntents();
});
    const editButton = document.getElementById('edit-table');
    const saveButton = document.getElementById('save-table');

    editButton.addEventListener('click', () => {
        const cells = document.querySelectorAll('#intents-table tbody td');
        cells.forEach(cell => cell.setAttribute('contenteditable', 'true'));

        editButton.style.display = 'none';
        saveButton.style.display = 'inline-block';
    });

    // Save Button
    saveButton.addEventListener('click', async () => {
        const rows = document.querySelectorAll('#intents-table tbody tr');
        const updatedIntents = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const intent = {
                tag: cells[0].textContent.trim(),
                patterns: cells[1].textContent.split(',').map(p => p.trim()),
                responses: cells[2].textContent.split(',').map(r => r.trim()),
                secondary_responses: cells[3].textContent.split(',').map(sr => sr.trim()),
                context: cells[4].textContent.trim(),
                suggestions: cells[5].textContent.split(',').map(s => s.trim()),
            };
            updatedIntents.push(intent);
        });

        // Send updated data to the backend
        try {
            const response = await axios.post('/api/update_intents', { intents: updatedIntents });
            if (response.data.message) {
                alert('Intents updated successfully!');
            } else {
                alert('Failed to save changes.');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('An error occurred while saving changes.');
        }

        const cells = document.querySelectorAll('#intents-table tbody td');
        cells.forEach(cell => cell.setAttribute('contenteditable', 'false'));

        saveButton.style.display = 'none';
        editButton.style.display = 'inline-block';
    });

    rows.forEach(row => {
        row.querySelectorAll('td').forEach(cell => {
            cell.setAttribute('contenteditable', 'false');
        });
    });

    // Show Edit button, hide Save button
    document.getElementById('edit-table').style.display = 'inline-block';
    document.getElementById('save-table').style.display = 'none';