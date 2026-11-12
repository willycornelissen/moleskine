import React, { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotes } from "@/hooks/useNotes";
import { useHashFilter } from "@/hooks/useHashFilter";
import { useSearch } from "@/hooks/useSearch";
import type { NoteDocument } from "@/types/note";

import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { NoteEditor } from "@/components/NoteEditor";
import { SearchBar } from "@/components/SearchBar";
import { CalendarView } from "@/components/CalendarView";
import { NoteList } from "@/components/NoteList";
import { BackupModal } from "@/components/BackupModal";

export const App: React.FC = () => {
  const {
    user,
    loading: authLoading,
    isAuthorized,
    error: authError,
    signInWithGoogle,
    logout,
  } = useAuth();

  const {
    notes,
    loading: notesLoading,
    syncStatus,
    error: notesError,
    addNote,
    editNote,
    removeNote,
  } = useNotes(user?.uid);

  const { activeTag, setTag } = useHashFilter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteDocument | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Filtra notas em memória
  const filteredNotes = useSearch(notes, {
    query: searchQuery,
    tag: activeTag,
    selectedDate,
  });

  const handleSaveNote = useCallback(
    async (text: string, tags: string[]) => {
      if (editingNote) {
        await editNote(editingNote.id, text, tags);
        setEditingNote(null);
      } else {
        await addNote(text, tags);
      }
    },
    [editingNote, editNote, addNote]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingNote(null);
  }, []);

  const handleEditNote = useCallback((note: NoteDocument) => {
    setEditingNote(note);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      if (editingNote?.id === noteId) {
        setEditingNote(null);
      }
      await removeNote(noteId);
    },
    [editingNote, removeNote]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      setTag(tag);
    },
    [setTag]
  );

  const handleClearTag = useCallback(() => {
    setTag(null);
  }, [setTag]);

  return (
    <AuthGuard
      loading={authLoading}
      isAuthorized={isAuthorized}
      user={user}
      error={authError}
      onLogin={signInWithGoogle}
    >
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800">
        <Header
          user={user}
          syncStatus={syncStatus}
          onOpenBackup={() => setIsBackupOpen(true)}
          onLogout={logout}
        />

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
          {notesError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
              {notesError}
            </div>
          )}

          <NoteEditor
            editingNote={editingNote}
            onSave={handleSaveNote}
            onCancelEdit={handleCancelEdit}
          />

          <SearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            activeTag={activeTag}
            onClearTag={handleClearTag}
            selectedDate={selectedDate}
            onClearDate={() => setSelectedDate(null)}
            isCalendarOpen={isCalendarOpen}
            onToggleCalendar={() => setIsCalendarOpen((prev) => !prev)}
          />

          {isCalendarOpen && (
            <CalendarView
              notes={notes}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}

          {notesLoading ? (
            <div className="py-12 text-center text-sm text-zinc-400">
              Sincronizando suas notas...
            </div>
          ) : (
            <NoteList
              notes={filteredNotes}
              hasFilter={Boolean(searchQuery.trim() || activeTag || selectedDate)}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onTagClick={handleTagClick}
            />
          )}
        </main>

        <BackupModal
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          notes={notes}
        />
      </div>
    </AuthGuard>
  );
};

export default App;
