import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity, TextInput, FlatList, Modal, Animated, Dimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar'

const { width } = Dimensions.get('window')

// AI Summary simulation (replace with real AI API later)
const generateAISummary = (transcript) => {
  const summaries = [
    "Key points: Important meeting about project deadlines. Action items assigned to team members.",
    "Main topics discussed: Budget planning, marketing strategy, team assignments.",
    "Summary: Decision made to proceed with Phase 2. Timeline confirmed for next week.",
    "Notes: Ideas shared about new product features. Customer feedback discussed.",
  ]
  return summaries[Math.floor(Math.random() * summaries.length)]
}

const generateAIActionItems = (transcript) => {
  const items = [
    "Follow up with team",
    "Send summary email",
    "Schedule next meeting",
    "Review budget",
  ]
  return items.slice(0, Math.floor(Math.random() * 3) + 1)
}

// Demo notes
const demoNotes = [
  { id: '1', title: 'Meeting Notes', transcript: 'We discussed the new project timeline and assigned tasks to team members. The deadline is next Friday.', summary: 'Project deadline discussed. Tasks assigned.', actions: ['Follow up with team'], duration: '0:45', date: 'Today', isPinned: true },
  { id: '2', title: 'Ideas', transcript: 'Brainstorming session about the new app features. We came up with some great ideas for user engagement.', summary: 'New app feature ideas generated.', actions: [], duration: '1:20', date: 'Yesterday', isPinned: false },
]

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [notes, setNotes] = useState(demoNotes)
  const [selectedNote, setSelectedNote] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showNewNote, setShowNewNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const recordingAnim = useState(new Animated.Value(1))[0]

  // Recording animation
  useEffect(() => {
    let interval
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(d => d + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const startRecording = () => {
    setIsRecording(true)
    setRecordingDuration(0)
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(recordingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start()
  }

  const stopRecording = () => {
    setIsRecording(false)
    recordingAnim.setValue(1)
    
    // Create new note with simulated AI
    if (recordingDuration > 2) {
      const newNote = {
        id: Date.now().toString(),
        title: newNoteTitle || `Voice Note ${notes.length + 1}`,
        transcript: 'This is a simulated voice transcript. In the real app, this would be your actual voice converted to text using AI.',
        summary: generateAISummary(''),
        actions: generateAIActionItems(''),
        duration: formatDuration(recordingDuration),
        date: 'Just now',
        isPinned: false,
      }
      setNotes([newNote, ...notes])
      setNewNoteTitle('')
      setShowNewNote(false)
    }
  }

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id))
    setSelectedNote(null)
  }

  const togglePin = (id) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n))
  }

  // Home Screen
  if (currentScreen === 'home') {
    const pinnedNotes = notes.filter(n => n.isPinned)
    const regularNotes = notes.filter(n => !n.isPinned)
    const allNotes = [...pinnedNotes, ...regularNotes]

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Voice Notes</Text>
          <Text style={styles.headerSubtitle}>{notes.length} notes</Text>
        </View>

        <FlatList
          data={allNotes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.noteCard} onPress={() => { setSelectedNote(item); setCurrentScreen('note'); }}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteDuration}>{item.duration}</Text>
                {item.isPinned && <Text style={styles.pinIcon}>📌</Text>}
              </View>
              <Text style={styles.noteTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.noteSummary} numberOfLines={3}>{item.summary}</Text>
              <Text style={styles.noteDate}>{item.date}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎤</Text>
              <Text style={styles.emptyText}>No voice notes yet</Text>
              <Text style={styles.emptySubtext}>Tap the mic to record</Text>
            </View>
          }
        />

        {/* New Note Modal */}
        <Modal visible={showNewNote} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>NEW RECORDING</Text>
                <TouchableOpacity onPress={() => setShowNewNote(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.titleInput}
                placeholder="Note title (optional)"
                placeholderTextColor="#999"
                value={newNoteTitle}
                onChangeText={setNewNoteTitle}
              />

              <View style={styles.recordButtonContainer}>
                <Animated.View style={[styles.recordButtonOuter, { transform: [{ scale: isRecording ? recordingAnim : 1 }] }]}>
                  <TouchableOpacity 
                    style={[styles.recordButton, isRecording && styles.recordingActive]} 
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                  >
                    <Text style={styles.recordIcon}>{isRecording ? '⏹' : '🎤'}</Text>
                  </TouchableOpacity>
                </Animated.View>
                <Text style={styles.recordHint}>
                  {isRecording ? `Recording ${formatTime(recordingDuration)}` : 'Hold to record'}
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* Floating Record Button */}
        <TouchableOpacity style={styles.fab} onPress={() => setShowNewNote(true)}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        <StatusBar style="dark" />
      </View>
    )
  }

  // Note Detail Screen
  if (currentScreen === 'note' && selectedNote) {
    return (
      <View style={styles.container}>
        <View style={styles.noteHeaderBar}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.noteActions}>
            <TouchableOpacity onPress={() => togglePin(selectedNote.id)}>
              <Text style={styles.actionIcon}>{selectedNote.isPinned ? '📌' : '📍'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteNote(selectedNote.id)}>
              <Text style={styles.deleteIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.noteDetail}>
          <Text style={styles.noteDetailTitle}>{selectedNote.title}</Text>
          <View style={styles.noteMeta}>
            <Text style={styles.noteMetaText}>{selectedNote.duration}</Text>
            <Text style={styles.noteMetaDot}>•</Text>
            <Text style={styles.noteMetaText}>{selectedNote.date}</Text>
          </View>

          <View style={styles.aiSection}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI SUMMARY</Text>
            </View>
            <Text style={styles.aiText}>{selectedNote.summary}</Text>
          </View>

          {selectedNote.actions.length > 0 && (
            <View style={styles.aiSection}>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>ACTION ITEMS</Text>
              </View>
              {selectedNote.actions.map((action, i) => (
                <View key={i} style={styles.actionItem}>
                  <Text style={styles.actionCheckbox}>☐</Text>
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.aiSection}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>TRANSCRIPT</Text>
            </View>
            <Text style={styles.transcriptText}>{selectedNote.transcript}</Text>
          </View>
        </View>

        <StatusBar style="dark" />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  list: { padding: 16 },
  row: { justifyContent: 'space-between' },
  noteCard: { width: (width - 48) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  noteDuration: { fontSize: 12, color: '#888', fontWeight: '600' },
  pinIcon: { fontSize: 14 },
  noteTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  noteSummary: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 12 },
  noteDate: { fontSize: 11, color: '#aaa' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  fabIcon: { fontSize: 28, color: '#fff', fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  modalClose: { fontSize: 20, color: '#888' },
  titleInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 30 },
  recordButtonContainer: { alignItems: 'center' },
  recordButtonOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  recordButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  recordingActive: { backgroundColor: '#ff4444' },
  recordIcon: { fontSize: 32 },
  recordHint: { marginTop: 16, fontSize: 14, color: '#888' },
  noteHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { fontSize: 24 },
  noteActions: { flexDirection: 'row', gap: 20 },
  actionIcon: { fontSize: 20 },
  deleteIcon: { fontSize: 20 },
  noteDetail: { flex: 1, padding: 20 },
  noteDetailTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  noteMetaText: { fontSize: 13, color: '#888' },
  noteMetaDot: { marginHorizontal: 8, color: '#888' },
  aiSection: { marginBottom: 24 },
  aiBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  aiBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#2e7d32', letterSpacing: 1 },
  aiText: { fontSize: 15, color: '#333', lineHeight: 24 },
  actionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  actionCheckbox: { fontSize: 16, marginRight: 10 },
  actionText: { fontSize: 14, color: '#333' },
  transcriptText: { fontSize: 14, color: '#666', lineHeight: 24, fontStyle: 'italic' },
})
