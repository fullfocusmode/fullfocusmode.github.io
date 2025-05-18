document.addEventListener('DOMContentLoaded', function() { 
    // Data management for notes 

    const NoteManager = { 
        init: function() { 
            this.loadNotes(); 
            this.renderNotes(); 
            this.setupEventListeners(); 
        }, 
        notes: [], 
        loadNotes: function() { 
            const storedNotes = localStorage.getItem('fullfocus_notes'); 
            this.notes = storedNotes ? JSON.parse(storedNotes) : []; 
        }, 
        saveNotes: function() { 
            localStorage.setItem('fullfocus_notes', JSON.stringify(this.notes)); 
            this.renderNotes(); 
        }, 
        addNote: function(note) { 
            note.id = Date.now().toString(36) + Math.random().toString(36).substr(2); 
            this.notes.unshift(note); // Add to the beginning 
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
            const notesGrid = document.getElementById('notes-grid'); 
            notesGrid.innerHTML = ''; 

            this.notes.forEach(note => { 
                const noteItem = this.createNoteElement(note); 
                notesGrid.appendChild(noteItem); 
            }); 
        }, 
        createNoteElement: function(note) { 
            const noteItem = document.createElement('div'); 
            noteItem.classList.add('note-item', note.color.replace('#', '')); // Add color class 
            noteItem.dataset.id = note.id; 
            noteItem.innerHTML = ` 
                <div class="note-title">${note.title} <span class="note-word-count">${this.getWordCount(note.content)}</span></div> 
                <div class="note-content">${note.content}</div> 
            `; 

            noteItem.addEventListener('click', () => { 
                this.showNoteDetails(note.id); 
            }); 
            return noteItem; 
        }, 
        getWordCount: function(text) { 
            return text.trim().split(/\s+/).length; 
        }, 
        showNoteDetails: function(noteId) { 
            // Find the note and move it to the top 
            const index = this.notes.findIndex(note => note.id === noteId); 
            if (index !== -1) { 
                const note = this.notes.splice(index, 1)[0]; 
                this.notes.unshift(note); 
                this.saveNotes(); 
            } 
        }, 
        setupEventListeners: function() { 
            document.getElementById('new-note-btn').addEventListener('click', () => openModal('new-note-modal')); 
            document.getElementById('new-note-form').addEventListener('submit', (e) => { 
                e.preventDefault(); 
                const noteData = { 
                    title: document.getElementById('note-title').value, 
                    content: document.getElementById('note-content').value, 
                    color: document.getElementById('note-color').value 
                }; 
                this.addNote(noteData); 
                closeCurrentModal(); 
                document.getElementById('new-note-form').reset(); 
            }); 
        } 
    }; 

    // UI event handlers (shared between tasks and notes) 
    function setupEventListeners() { 
        // Sidebar toggle 
        document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar); 
        document.getElementById('close-sidebar').addEventListener('click', closeSidebar); 

        // Settings button 
        document.getElementById('settings-btn').addEventListener('click', () => openModal('settings-modal')); 

        // Close modal buttons 
        document.querySelectorAll('.close, .cancel-btn').forEach(button => { 
            button.addEventListener('click', closeCurrentModal); 
        }); 

        // Close modals when clicking outside 
        window.addEventListener('click', event => { 
            if (event.target.classList.contains('modal')) { 
                closeCurrentModal(); 
            } 
        }); 

        // Handle theme selector 
        document.getElementById('theme-selector').addEventListener('change', function() { 
            TaskManager.settings.theme = this.value; 
            TaskManager.saveSettings(); 
            TaskManager.applySettings(); 
        }); 

        // Handle data export 
        document.getElementById('export-data').addEventListener('click', function() { 
            const data = { 
                tasks: TaskManager.tasks, 
                embeds: TaskManager.embeds, 
                quickLinks: TaskManager.quickLinks, 
                settings: TaskManager.settings, 
                notes: NoteManager.notes 
            }; 
            const dataStr = JSON.stringify(data); 
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr); 
            const exportLink = document.createElement('a'); 
            exportLink.setAttribute('href', dataUri); 
            exportLink.setAttribute('download', 'fullfocus_backup.json'); 
            document.body.appendChild(exportLink); 
            exportLink.click(); 
            document.body.removeChild(exportLink); 
        }); 

        // Handle data import 
        document.getElementById('import-data').addEventListener('click', function() { 
            const input = document.createElement('input'); 
            input.type = 'file'; 
            input.accept = '.json'; 
            input.onchange = e => { 
                const file = e.target.files[0]; 
                if (!file) return; 
                const reader = new FileReader(); 
                reader.onload = e => { 
                    const result = TaskManager.importData(e.target.result); 
                    if (result) { 
                        alert('Data imported successfully!'); 
                        closeCurrentModal(); 
                    } else { 
                        alert('Failed to import data. Please check the file format.'); 
                    } 
                }; 
                reader.readAsText(file); 
            }; 
            input.click(); 
        }); 

        // Handle clear all data 
        document.getElementById('clear-data').addEventListener('click', function() { 
            if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) { 
                localStorage.clear(); 
                TaskManager.tasks = []; 
                TaskManager.embeds = []; 
                TaskManager.quickLinks = []; 
                TaskManager.settings = { theme: 'light' }; 
                NoteManager.notes = []; 
                TaskManager.renderTasks(); 
                TaskManager.renderEmbeds(); 
                TaskManager.renderQuickLinks(); 
                TaskManager.applySettings(); 
                TaskManager.renderCalendar(); 
                NoteManager.renderNotes(); 
            } 
        }); 

        // Add embed button 
        document.getElementById('add-embed-btn').addEventListener('click', () => openModal('embed-modal')); 

        // Add quick link button 
        document.getElementById('add-quicklink-btn').addEventListener('click', () => openModal('quicklink-modal')); 

        // Handle new task form submission 
        document.getElementById('new-task-form').addEventListener('submit', function(e) { 
            e.preventDefault(); 
            const taskData = { 
                title: document.getElementById('task-title').value, 
                description: document.getElementById('task-description').value, 
                type: document.getElementById('task-type').value, 
                priority: document.getElementById('task-priority').value 
            }; 
            if (taskData.type === 'categorized') { 
                taskData.date = document.getElementById('task-date').value; 
            } 
            TaskManager.addTask(taskData); 
            closeCurrentModal(); 
            this.reset(); 
            document.querySelector('.date-group').style.display = 'none'; 
        }); 

        // Handle embed form submission 
        document.getElementById('embed-form').addEventListener('submit', function(e) { 
            e.preventDefault(); 
            const embedData = { 
                title: document.getElementById('embed-title').value, 
                url: document.getElementById('embed-url').value 
            }; 
            TaskManager.addEmbed(embedData); 
            closeCurrentModal(); 
            this.reset(); 
        }); 

        // Handle quick link form submission 
        document.getElementById('quicklink-form').addEventListener('submit', function(e) { 
            e.preventDefault(); 
            const quickLinkData = { 
                title: document.getElementById('quicklink-title').value, 
                url: document.getElementById('quicklink-url').value 
            }; 
            TaskManager.addQuickLink(quickLinkData); 
            closeCurrentModal(); 
            this.reset(); 
        }); 

        // Handle search 
        document.getElementById('search-btn').addEventListener('click', function() { 
            const query = document.getElementById('search-input').value.trim(); 
            if (query) { 
                TaskManager.searchTasks(query); 
            } else { 
                TaskManager.renderTasks(); 
            } 
        }); 

        document.getElementById('search-input').addEventListener('keyup', function(e) { 
            if (e.key === 'Enter') { 
                const query = this.value.trim(); 
                if (query) { 
                    TaskManager.searchTasks(query); 
                } else { 
                    TaskManager.renderTasks(); 
                } 
            } 
        }); 

        // Handle task type selection 
        document.getElementById('task-type').addEventListener('change', function() { 
            const dateGroup = document.querySelector('.date-group'); 
            if (this.value === 'categorized') { 
                dateGroup.style.display = 'block'; 
            } else { 
                dateGroup.style.display = 'none'; 
            } 
        }); 

        // Handle edit task button 
        document.getElementById('edit-task-btn').addEventListener('click', function() { 
            const taskId = this.dataset.id; 
            const task = TaskManager.tasks.find(t => t.id === taskId); 
            if (task) { 
                document.getElementById('task-title').value = task.title; 
                document.getElementById('task-description').value = task.description || ''; 
                document.getElementById('task-type').value = task.type; 
                document.getElementById('task-priority').value = task.priority; 
                const dateGroup = document.querySelector('.date-group'); 
                if (task.type === 'categorized') { 
                    dateGroup.style.display = 'block'; 
                    document.getElementById('task-date').value = task.date || ''; 
                } else { 
                    dateGroup.style.display = 'none'; 
                } 
                const form = document.getElementById('new-task-form'); 
                const originalSubmitHandler = form.onsubmit; 
                form.onsubmit = function(e) { 
                    e.preventDefault(); 
                    const updates = { 
                        title: document.getElementById('task-title').value, 
                        description: document.getElementById('task-description').value, 
                        type: document.getElementById('task-type').value, 
                        priority: document.getElementById('task-priority').value 
                    }; 
                    if (updates.type === 'categorized') { 
                        updates.date = document.getElementById('task-date').value; 
                    } else { 
                        updates.date = null; 
                    } 
                    TaskManager.updateTask(taskId, updates); 
                    closeCurrentModal(); 
                    form.reset(); 
                    form.onsubmit = originalSubmitHandler; 
                    document.querySelector('.date-group').style.display = 'none'; 
                }; 
                closeCurrentModal(); 
                openModal('new-task-modal'); 
            } 
        }); 

        // Handle delete task button 
        document.getElementById('delete-task-btn').addEventListener('click', function() { 
            const taskId = this.dataset.id; 
            TaskManager.deleteTask(taskId); 
            closeCurrentModal(); 
        }); 
    } 

    function toggleSidebar() { 
        const sidebar = document.getElementById('sidebar'); 
        const mainContent = document.querySelector('.main-content'); 
        sidebar.classList.toggle('collapsed'); 
        mainContent.classList.toggle('expanded'); 
    } 

    function closeSidebar() { 
        const sidebar = document.getElementById('sidebar'); 
        const mainContent = document.querySelector('.main-content'); 
        sidebar.classList.add('collapsed'); 
        mainContent.classList.add('expanded'); 
    } 

    function openModal(modalId) { 
        closeCurrentModal(); 
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

    // Initialize both TaskManager and NoteManager 
    setupEventListeners(); 
    NoteManager.init(); 
});
