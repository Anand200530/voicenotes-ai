import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity, TextInput, FlatList, Modal, Animated, Dimensions, Alert, Share, ScrollView } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

const NOTES_KEY = 'voicenotes_data'

const generateAISummary = async (transcript) => {
  const summaries = [
    "Key points: Important discussion about project deadlines and team assignments. Action items identified.",
    "Main topics: Budget planning, marketing strategy, and timeline review. Decisions made on next steps.",
    "Summary: Brainstorming session results with 3 new ideas documented. Follow-up tasks assigned.",
    "Notes: Customer feedback discussed with 2 main concerns highlighted. Product improvements suggested.",
  ]
  return summaries[Math.floor(Math.random() * summaries.length)]
}

const generateAIActions = async (transcript) => {
  const actions = [
    ["Follow up with team", "Send summary email"],
    ["Review budget proposal", "Schedule next meeting"],
    ["Document ideas", "Share with stakeholders"],
    ["Update project tracker", "Assign tasks"],
  ]
  return actions[Math.floor(Math.random() * actions.length)].slice(0, Math.floor(Math.random() * 2) + 1)
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState(['All', 'Work', 'Personal', 'Ideas'])
  const [currentFolder, setCurrentFolder] = useState('All')
  const [selectedNote, setSelectedNote] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showNewNote, setShowNewNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const recordingAnim = useRef(new Animated.Value(1)).current
  

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem(NOTES_KEY)
      if (savedNotes) setNotes(JSON.parse(savedNotes))
    } catch (e) { console.log('Error loading:', e) }
    setLoading(false)
  }

  const saveNotes = async (newNotes) => {
    setNotes(newNotes)
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes))
  }

  useEffect(() => {
    let interval
    if (isRecording) {
      interval = setInterval(() => { setRecordingDuration(d => d + 1) }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const startRecording = () => {
    setIsRecording(true)
    setRecordingDuration(0)
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(recordingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start()
  }

  const stopRecording = async () => {
    setIsRecording(false)
    recordingAnim.setValue(1)
    
    if (recordingDuration > 3) {
      setIsProcessing(true)
      const transcript = 'This is a voice recording that will be processed by AI to generate summaries and action items.'
      const summary = await generateAISummary(transcript)
      const actions = await generateAIActions(transcript)
      
      const newNote = {
        id: Date.now().toString(),
        title: newNoteTitle || `Voice Note ${notes.length + 1}`,
        transcript,
        summary,
        actions,
        duration: formatDuration(recordingDuration),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isPinned: false,
        folder: currentFolder === 'All' ? 'Personal' : currentFolder,
        createdAt: Date.now(),
      }
      
      await saveNotes([newNote, ...notes])
      setNewNoteTitle('')
      setShowNewNote(false)
      setIsProcessing(false)
    }
  }

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const deleteNote = async (id) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const newNotes = notes.filter(n => n.id !== id)
        await saveNotes(newNotes)
        setSelectedNote(null)
      }}
    ])
  }

  const togglePin = async (id) => {
    const newNotes = notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n)
    await saveNotes(newNotes)
  }

  const shareNote = async (note) => {
    try {
      await Share.share({
        message: `${note.title}\n\n${note.summary}\n\nAction Items:\n${note.actions.map(a => '• ' + a).join('\n')}`,
      })
    } catch (e) { console.log('Share error:', e) }
  }

  const updateNote = async (id, field, value) => {
    const newNotes = notes.map(n => n.id === id ? { ...n, [field]: value } : n)
    await saveNotes(newNotes)
    setSelectedNote({ ...selectedNote, [field]: value })
  }

  const filteredNotes = notes.filter(note => {
    const matchesFolder = currentFolder === 'All' || note.folder === currentFolder
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         note.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFolder && matchesSearch
  })

  const pinnedNotes = filteredNotes.filter(n => n.isPinned)
  const regularNotes = filteredNotes.filter(n => !n.isPinned)
  const displayNotes = [...pinnedNotes, ...regularNotes]

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#1a1a1a" /></View>
  }

  if (selectedNote) {
    return (
      <View style={styles.container}>
        <View style={styles.noteHeaderBar}>
          <TouchableOpacity onPress={() => setSelectedNote(null)}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.noteActions}>
            <TouchableOpacity onPress={() => togglePin(selectedNote.id)}>
              <Text style={styles.actionIcon}>{selectedNote.isPinned ? '📌' : '📍'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareNote(selectedNote)}>
              <Text style={styles.actionIcon}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteNote(selectedNote.id)}>
              <Text style={styles.deleteIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.noteDetail}>
          <TextInput
            style={styles.noteDetailTitle}
            value={selectedNote.title}
            onChangeText={(t) => updateNote(selectedNote.id, 'title', t)}
            placeholder="Note title"
          />
          <View style={styles.noteMeta}>
            <Text style={styles.noteMetaText}>{selectedNote.duration}</Text>
            <Text style={styles.noteMetaDot}>•</Text>
            <Text style={styles.noteMetaText}>{selectedNote.date}</Text>
            <Text style={styles.noteMetaDot}>•</Text>
            <Text style={styles.noteMetaText}>{selectedNote.folder}</Text>
          </View>

          <View style={styles.aiSection}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>🤖 AI SUMMARY</Text>
            </View>
            <TextInput
              style={styles.aiText}
              value={selectedNote.summary}
              onChangeText={(t) => updateNote(selectedNote.id, 'summary', t)}
              multiline
            />
          </View>

          {selectedNote.actions.length > 0 && (
            <View style={styles.aiSection}>
              <View style={[styles.aiBadge, { backgroundColor: '#fff3e0' }]}>
                <Text style={[styles.aiBadgeText, { color: '#e65100' }]}>✓ ACTION ITEMS</Text>
              </View>
              {selectedNote.actions.map((action, i) => (
                <View key={i} style={styles.actionItem}>
                  <TouchableOpacity onPress={() => {
                    const newActions = [...selectedNote.actions]
                    newActions[i] = action.startsWith('✓ ') ? action.slice(2) : '✓ ' + action
                    updateNote(selectedNote.id, 'actions', newActions)
                  }}>
                    <Text style={styles.actionCheckbox}>{action.startsWith('✓ ') ? '☑' : '☐'}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.actionText, action.startsWith('✓ ') && styles.actionDone]}>{action.startsWith('✓ ') ? action.slice(2) : action}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.aiSection}>
            <View style={[styles.aiBadge, { backgroundColor: '#e3f2fd' }]}>
              <Text style={[styles.aiBadgeText, { color: '#1565c0' }]}>📝 TRANSCRIPT</Text>
            </View>
            <Text style={styles.transcriptText}>{selectedNote.transcript}</Text>
          </View>
        </ScrollView>
        <StatusBar style="dark" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Voice Notes</Text>
            <Text style={styles.headerSubtitle}>{notes.length} notes • {notes.filter(n => n.isPinned).length} pinned</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderScroll}>
          {folders.map(folder => (
            <TouchableOpacity
              key={folder}
              style={[styles.folderChip, currentFolder === folder && styles.folderChipActive]}
              onPress={() => setCurrentFolder(folder)}
            >
              <Text style={[styles.folderText, currentFolder === folder && styles.folderTextActive]}>{folder}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={displayNotes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.noteCard} onPress={() => setSelectedNote(item)}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteDuration}>{item.duration}</Text>
              {item.isPinned && <Text style={styles.pinIcon}>📌</Text>}
            </View>
            <Text style={styles.noteTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.noteSummary} numberOfLines={3}>{item.summary}</Text>
            <View style={styles.noteFooter}>
              <Text style={styles.noteDate}>{item.date}</Text>
              <View style={styles.folderTag}><Text style={styles.folderTagText}>{item.folder}</Text></View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎤</Text>
            <Text style={styles.emptyText}>{searchQuery ? 'No matching notes' : 'No voice notes yet'}</Text>
            <Text style={styles.emptySubtext}>{searchQuery ? 'Try different search' : 'Tap the mic to record'}</Text>
          </View>
        }
      />

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

            <View style={styles.folderSelect}>
              <Text style={styles.folderSelectLabel}>Save to folder:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {folders.filter(f => f !== 'All').map(folder => (
                  <TouchableOpacity
                    key={folder}
                    style={[styles.folderChip, currentFolder === folder && styles.folderChipActive]}
                    onPress={() => setCurrentFolder(folder)}
                  >
                    <Text style={[styles.folderText, currentFolder === folder && styles.folderTextActive]}>{folder}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.recordButtonContainer}>
              {isProcessing ? (
                <View style={styles.processing}>
                  <ActivityIndicator size="large" color="#1a1a1a" />
                  <Text style={styles.processingText}>Processing with AI...</Text>
                </View>
              ) : (
                <>
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
                    {isRecording ? `Recording ${formatDuration(recordingDuration)}` : 'Hold to record'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => setShowNewNote(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <StatusBar style="dark" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  clearSearch: { color: '#999', fontSize: 16 },
  folderScroll: { marginBottom: 8 },
  folderChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', marginRight: 8 },
  folderChipActive: { backgroundColor: '#1a1a1a' },
  folderText: { fontSize: 13, color: '#666' },
  folderTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16 },
  row: { justifyContent: 'space-between' },
  noteCard: { width: (width - 48) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  noteDuration: { fontSize: 12, color: '#888', fontWeight: '600' },
  pinIcon: { fontSize: 14 },
  noteTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  noteSummary: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 12 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteDate: { fontSize: 11, color: '#aaa' },
  folderTag: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  folderTagText: { fontSize: 10, color: '#666' },
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
  titleInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  folderSelect: { marginBottom: 24 },
  folderSelectLabel: { fontSize: 12, color: '#888', marginBottom: 8 },
  recordButtonContainer: { alignItems: 'center' },
  processing: { alignItems: 'center' },
  processingText: { marginTop: 12, fontSize: 14, color: '#666' },
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
  aiText: { fontSize: 15, color: '#333', lineHeight: 24, minHeight: 60 },
  actionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  actionCheckbox: { fontSize: 18, marginRight: 10 },
  actionText: { fontSize: 14, color: '#333' },
  actionDone: { textDecorationLine: 'line-through', color: '#aaa' },
  transcriptText: { fontSize: 14, color: '#666', lineHeight: 24, fontStyle: 'italic' },
})
