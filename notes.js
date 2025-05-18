// Script for note management 

const NoteManager = { //Renamed to avoid conflict 
    init: function() { 
        this.loadNotes(); 
        this.renderNotes(); 
    }, 

    notes: [], 

    loadNotes: function() { 
        const storedNotes = localStorage.getItem('fullfocus_notes'); 
        this.notes = storedNotes ? JSON.parse(storedNotes) : []; 
    }, 

    saveNotes: function() { 
        localStorage.setItem('fullfocus_notes', JSON.stringify(this.notes)); 
    }, 

    addNote: function(note) { 
        note.id = Date.now().toString(36) + Math.random().toString(36).substr(2); 
        this.notes.push(note); 
        this.saveNotes(); 
    }, 

    updateNote: function(noteId, updates) { 
        const index = this.notes.findIndex(note => note.id === noteId); 
        if (index !== -1) { 
            this.notes[index] = { ...this.notes[index], ...updates }; 
            this.saveNotes(); 
        } 
    }, 

    deleteNote: function(noteId) { 
        this.notes = this.notes.filter(note => note.id !== noteId); 
        this.saveNotes(); 
    }, 

    renderNotes: function() { 
        const notesListEl = document.getElementById('notes-list'); 
        notesListEl.innerHTML = ''; 

        this.notes.sort((a, b) => new Date(b.date) - new Date(a.date)); 

        if (this.notes.length === 0) { 
            notesListEl.innerHTML = '<div class="empty-message">No notes yet</div>'; 
        } else { 
            this.notes.forEach(note => { 
                const noteElement = this.createNoteElement(note); 
                notesListEl.appendChild(noteElement); 
            }); 
        } 
    }, 

    createNoteElement: function(note) { 
        const noteElement = document.createElement('div'); 
        noteElement.classList.add('note-item', note.color); 
        noteElement.dataset.id = note.id; 

        const titleEl = document.createElement('div'); 
        titleEl.classList.add('note-title'); 
        titleEl.textContent = note.title; 

        const dateEl = document.createElement('div'); 
        dateEl.classList.add('note-date'); 
        dateEl.textContent = new Date(note.date).toLocaleDateString(); 

        noteElement.appendChild(titleEl); 
        noteElement.appendChild(dateEl); 

        noteElement.addEventListener('click', () => this.showNote(note.id)); 

        return noteElement; 
    }, 

    showNote: function(noteId) { 
        const note = this.notes.find(n => n.id === noteId); 
        if (!note) return; 

        this.notes = this.notes.filter(n => n.id !== noteId); 
        this.notes.unshift(note); 
        this.saveNotes(); 

        document.getElementById('note-editor').innerHTML = ` 
            <h2>${note.title}</h2> 
            <textarea>${note.content}</textarea> 
            <div class="form-buttons"> 
                <button id="save-note-btn" data-id="${note.id}">Save</button> 
                <button id="delete-note-btn" data-id="${note.id}" class="danger">Delete</button> 
            </div> 
        `; 

        document.getElementById('save-note-btn').addEventListener('click', this.saveEditedNote.bind(this)); 
        document.getElementById('delete-note-btn').addEventListener('click', this.deleteNote.bind(this)); 
    }, 

    saveEditedNote: function(event) { 
        const noteId = event.target.dataset.id; 
        const title = document.querySelector('#note-editor h2').textContent; 
        const content = document.querySelector('#note-editor textarea').value; 
        this.updateNote(noteId, { title, content, date: new Date() }); 
    } 
}; 

document.addEventListener('DOMContentLoaded', function() { 
    NoteManager.init(); 
    setupNoteListeners(); 
}); 

function openModal(modalId) {
    // Close any open modals first
    closeCurrentModal();
    
    // Open the requested modal
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeCurrentModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function setupNoteListeners() { 
    const newNoteButton = document.getElementById('new-note-btn'); 
    newNoteButton.addEventListener('click', () => openModal('new-note-modal')); 

    const newNoteForm = document.getElementById('new-note-form'); 
    newNoteForm.addEventListener('submit', function(e) { 
        e.preventDefault(); 
        const title = document.getElementById('note-title').value; 
        const color = document.getElementById('note-color').value; 
        TaskManager.addNote({ title, color, content: '', date: new Date() }); 
        closeCurrentModal(); 
    }); 

    // Add event listener for saving edited notes 
    document.addEventListener('click', function(e) { 
        if (e.target && e.target.id === 'save-note-btn') { 
            TaskManager.saveEditedNote(e); 
        } 
    }); 

    // Add event listener for deleting notes 
    document.addEventListener('click', function(e) { 
        if (e.target && e.target.id === 'delete-note-btn') { 
            const noteId = e.target.dataset.id; 
            TaskManager.deleteNote(noteId); 
            document.getElementById('note-editor').innerHTML = ''; // Clear editor after delete 
        } 
    }); 
}
