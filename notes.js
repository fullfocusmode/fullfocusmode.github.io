document.addEventListener('DOMContentLoaded', () => {
    const Storage = {
        get: (key) => JSON.parse(localStorage.getItem(key) || 'null'),
        set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
        append: (key, value) => {
            const current = Storage.get(key) || [];
            current.push(value);
            Storage.set(key, current);
        }
    };

    class NotesManager {
        constructor() {
            this.notes = Storage.get('notes') || [];
            this.currentNote = null;
            this.autoSaveInterval = null;
            this.init();
        }

        init() {
            this.setupEventListeners();
            this.renderNotesList();
            this.setupAutoSave();
            this.setupToolbar();
        }

        createNote() {
            const note = {
                id: Date.now(),
                title: 'Untitled Note',
                content: '',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            this.notes.unshift(note);
            this.saveNotes();
            this.renderNotesList();
            this.selectNote(note.id);
        }

        deleteNote(id) {
            this.notes = this.notes.filter(note => note.id !== id);
            this.saveNotes();
            this.renderNotesList();
            if (this.currentNote && this.currentNote.id === id) {
                this.currentNote = null;
                document.getElementById('editor').innerHTML = '';
            }
        }

        selectNote(id) {
            this.currentNote = this.notes.find(note => note.id === id);
            document.getElementById('editor').innerHTML = this.currentNote.content;
            this.updateWordCount();
            this.updateLastSaved();
        }

        saveNotes() {
            Storage.set('notes', this.notes);
        }

        setupAutoSave() {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
            }
            this.autoSaveInterval = setInterval(() => this.autoSave(), 30000);
        }

        autoSave() {
            if (this.currentNote) {
                this.currentNote.content = document.getElementById('editor').innerHTML;
                this.currentNote.updated = new Date().toISOString();
                this.saveNotes();
                this.updateLastSaved();
            }
        }

        setupToolbar() {
            document.querySelectorAll('.editor-toolbar button').forEach(button => {
                button.addEventListener('click', () => {
                    const command = button.getAttribute('data-command');
                    if (command === 'createLink') {
                        const url = prompt('Enter the URL:');
                        if (url) document.execCommand(command, false, url);
                    } else if (command === 'insertImage') {
                        const url = prompt('Enter the image URL:');
                        if (url) document.execCommand(command, false, url);
                    } else {
                        document.execCommand(command, false, null);
                    }
                });
            });
        }

        updateWordCount() {
            const text = document.getElementById('editor').innerText;
            const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
            document.getElementById('wordCount').textContent = `${wordCount} words`;
        }

        updateLastSaved() {
            if (this.currentNote) {
                const date = new Date(this.currentNote.updated);
                document.getElementById('lastSaved').textContent = 
                    `Last saved: ${date.toLocaleString()}`;
            }
        }

        setupEventListeners() {
            document.getElementById('addNoteBtn').addEventListener('click', 
                () => this.createNote());

            document.getElementById('editor').addEventListener('input', 
                () => this.updateWordCount());

            document.getElementById('searchNotes').addEventListener('input', 
                (e) => this.searchNotes(e.target.value));
        }

        searchNotes(query) {
            const searchTerm = query.toLowerCase();
            const filteredNotes = this.notes.filter(note =>
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm)
            );
            this.renderNotesList(filteredNotes);
        }

        renderNotesList(notesToRender = this.notes) {
            const list = document.getElementById('notesList');
            list.innerHTML = notesToRender.map(note => `
                <div class="note-item ${this.currentNote?.id === note.id ? 'active' : ''}" 
                     data-id="${note.id}">
                    <div class="note-info">
                        <h3>${note.title}</h3>
                        <span>${new Date(note.updated).toLocaleDateString()}</span>
                    </div>
                    <button class="delete-note" data-id="${note.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');

            // Add click handlers
            list.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.delete-note')) {
                        this.selectNote(parseInt(item.dataset.id));
                    }
                });
            });

            list.querySelectorAll('.delete-note').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this note?')) {
                        this.deleteNote(parseInt(button.dataset.id));
                    }
                });
            });
        }
    }

    // Initialize Notes Manager
    const notesManager = new NotesManager();
});
