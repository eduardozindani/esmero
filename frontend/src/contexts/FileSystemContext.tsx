import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import { useDocuments, useFolders } from '../hooks/useLocalStorage'
import { generateTitle } from '../services/api'
import { generateId } from '../utils/id'
import { extractTextFromHTML, isHTMLEmpty } from '../utils/html'
import { ANIMATIONS } from '../constants/ui'
import { getCurrentFolderId, deleteFolderRecursive, navigateBack as navigateBackUtils } from '../utils/folders'
import type { Document, Folder } from '../types'

interface FileSystemContextType {
    documents: Document[]
    folders: Folder[]
    currentDocumentId: string | null
    folderPath: string[]
    canvasContent: string
    isLoading: boolean
    focusCanvasTrigger: number

    // Actions
    triggerCanvasFocus: () => void
    loadDocument: (id: string) => void
    saveDocument: (content: string) => Promise<void>
    deleteDocument: (id: string) => void
    deleteCurrentDocument: () => void
    createFolder: (name: string) => void
    deleteFolder: (id: string) => void
    updateFolderName: (id: string, name: string) => void
    updateDocumentTitle: (id: string, title: string) => void
    navigateToFolder: (id: string | null) => void
    navigateBack: () => void
    setCanvasContent: (content: string) => void
    clearCanvas: () => void
    startNewDocument: () => void
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined)

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
    const [documents, setDocuments] = useDocuments()
    const [folders, setFolders] = useFolders()
    const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
    const [folderPath, setFolderPath] = useState<string[]>([])
    const [canvasContent, setCanvasContent] = useState('')
    const [isLoading] = useState(false) // General loading state if needed
    const [focusCanvasTrigger, setFocusCanvasTrigger] = useState(0)

    // Track current document ID for async operations
    const currentDocumentIdRef = useRef<string | null>(null)
    
    useEffect(() => {
        currentDocumentIdRef.current = currentDocumentId
    }, [currentDocumentId])

    const triggerCanvasFocus = useCallback(() => {
        setFocusCanvasTrigger(prev => prev + 1)
    }, [])

    // Track pending title generation
    const titleGenerationRef = useRef<string | null>(null)

    // Refs for accessing latest state in timeouts
    const documentsRef = useRef(documents)
    const foldersRef = useRef(folders)
    
    useEffect(() => { documentsRef.current = documents }, [documents])
    useEffect(() => { foldersRef.current = folders }, [folders])

    const loadDocument = useCallback((documentId: string) => {
        const doc = documents.find(d => d.id === documentId)
        if (doc) {
            console.log('=== LOADING ===')
            setCanvasContent(doc.content)
            setCurrentDocumentId(doc.id)
            setFocusCanvasTrigger(prev => prev + 1)
        }
    }, [documents])

    const saveDocument = useCallback(async (content: string) => {
        const trimmedContent = content.trim()
        console.log('=== SAVING ===')

        if (isHTMLEmpty(trimmedContent)) return

        const now = Date.now()
        
        // Determine document ID and if it's new
        // We capture these values before the state update
        const isNew = !currentDocumentId
        const docId = currentDocumentId || generateId('doc')
        
        // Check if we should generate a title
        // We trigger generation if it's a new document OR if the current title is empty/loading
        // and user hasn't manually modified it.
        let shouldGenerateTitle = false
        
        if (isNew) {
            shouldGenerateTitle = true
        } else {
            // For existing documents, check the ref to get latest state without depending on it in dependency array
            const existingDoc = documentsRef.current.find(d => d.id === docId)
            if (existingDoc && !existingDoc.title && !existingDoc.titleUserModified) {
                shouldGenerateTitle = true
            }
        }

        setDocuments((prevDocuments) => {
            const isUpdate = !!currentDocumentId
            
            // Check if document actually changed
            let existingDoc = undefined

            if (isUpdate) {
                existingDoc = prevDocuments.find(d => d.id === currentDocumentId)
                if (existingDoc) {
                    const currentText = extractTextFromHTML(trimmedContent)
                    const existingText = extractTextFromHTML(existingDoc.content)
                    const contentChanged = currentText !== existingText
                    const folderChanged = existingDoc.folderId !== getCurrentFolderId(folderPath)

                    if (!contentChanged && !folderChanged) {
                        return prevDocuments
                    }
                }
            }
            
            const newDoc: Document = isUpdate && existingDoc
                ? {
                    ...existingDoc,
                    content: trimmedContent,
                    updatedAt: now,
                    folderId: getCurrentFolderId(folderPath),
                    // If we are generating title, set loading flag
                    titleLoading: shouldGenerateTitle ? true : existingDoc.titleLoading
                }
                : {
                    id: docId,
                    content: trimmedContent,
                    title: '',
                    createdAt: now,
                    updatedAt: now,
                    folderId: getCurrentFolderId(folderPath),
                    titleLoading: true,
                    documentJustCreated: true
                }

            const updatedDocuments = isUpdate
                ? prevDocuments.map(doc => doc.id === docId ? newDoc : doc)
                : [...prevDocuments, newDoc]
            
            return updatedDocuments
        })
        
        // If it's a new document, we need to set the ID in the context
        if (isNew) {
            setCurrentDocumentId(docId)
            // Also update the ref immediately for consistency in this cycle if needed
            currentDocumentIdRef.current = docId
        }
        
        // Trigger Title Generation (Fire and Forget)
        if (shouldGenerateTitle) {
            generateTitle(trimmedContent)
                .then(title => {
                    setDocuments(prev => prev.map(doc => 
                        doc.id === docId 
                            ? { 
                                ...doc, 
                                title: title, 
                                titleLoading: false,
                                titleJustGenerated: true // Trigger fade-in
                              } 
                            : doc
                    ))
                    
                    // Remove the animation flag after a delay
                    setTimeout(() => {
                        setDocuments(prev => prev.map(doc => 
                            doc.id === docId 
                                ? { ...doc, titleJustGenerated: false } 
                                : doc
                        ))
                    }, ANIMATIONS.FADE_IN)
                })
                .catch(err => {
                    console.error('Title generation failed', err)
                    setDocuments(prev => prev.map(doc => 
                        doc.id === docId 
                            ? { ...doc, titleLoading: false, title: 'Untitled' } 
                            : doc
                    ))
                })
        }
        
    }, [currentDocumentId, folderPath, setDocuments])

    const deleteDocument = useCallback((documentId: string) => {
        // 1. Trigger animation state
        setDocuments((prev) => prev.map((doc) =>
            doc.id === documentId ? { ...doc, documentDeleting: true } : doc
        ))

        // 2. Wait for animation then delete
        setTimeout(() => {
            setDocuments((prev) => prev.filter(doc => doc.id !== documentId))
            
            // Check if the deleted document was the current one
            if (currentDocumentIdRef.current === documentId) {
                setCanvasContent('')
                setCurrentDocumentId(null)
                setFocusCanvasTrigger(prev => prev + 1)
            }
        }, ANIMATIONS.DOCUMENT_SLIDE_OUT)
    }, [setDocuments])

    const deleteCurrentDocument = useCallback(() => {
        if (currentDocumentId) {
            deleteDocument(currentDocumentId)
        } else {
            setCanvasContent('')
            setFocusCanvasTrigger(prev => prev + 1)
        }
    }, [currentDocumentId, deleteDocument])

    const createFolder = useCallback((name: string) => {
        const now = Date.now()
        const currentFolderId = getCurrentFolderId(folderPath)
        const newFolder = {
            id: generateId('folder'),
            name,
            parentFolderId: currentFolderId,
            createdAt: now,
            updatedAt: now,
            folderJustCreated: true
        }

        setFolders((prev) => [...prev, newFolder])
        setFolderPath((prev) => [...prev, newFolder.id])
        setFocusCanvasTrigger(prev => prev + 1)

        // Remove animation flag after animation completes
        setTimeout(() => {
            setFolders((prev) => prev.map(f => 
                f.id === newFolder.id ? { ...f, folderJustCreated: false } : f
            ))
        }, ANIMATIONS.DOCUMENT_SLIDE_IN)

    }, [folderPath, setFolders])

    // Re-implement deleteFolder with refs
    const deleteFolder = useCallback((folderId: string) => {
        // 1. Trigger animation
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, folderDeleting: true } : f))
        
        setTimeout(() => {
            const currentFolders = foldersRef.current
            const currentDocuments = documentsRef.current
            
            const { folders: updatedFolders, documents: updatedDocuments } = deleteFolderRecursive(
                currentFolders,
                currentDocuments,
                folderId
            )
            
            setFolders(updatedFolders)
            setDocuments(updatedDocuments)
    
            if (folderPath.includes(folderId)) {
                const indexOfDeleted = folderPath.indexOf(folderId)
                setFolderPath(folderPath.slice(0, indexOfDeleted))
            }
        }, ANIMATIONS.DOCUMENT_SLIDE_OUT)
    }, [folderPath, setFolders, setDocuments])

    const updateFolderName = useCallback((folderId: string, newName: string) => {
        const now = Date.now()
        setFolders((prev) => prev.map(folder =>
            folder.id === folderId
                ? { ...folder, name: newName, updatedAt: now }
                : folder
        ))
    }, [setFolders])

    const updateDocumentTitle = useCallback((documentId: string, newTitle: string) => {
        const now = Date.now()
        setDocuments((prev) => prev.map(doc =>
            doc.id === documentId
                ? { ...doc, title: newTitle, titleUserModified: true, updatedAt: now }
                : doc
        ))
    }, [setDocuments])

    const navigateToFolder = useCallback((folderId: string | null) => {
        if (folderId) {
            setFolderPath((prev) => [...prev, folderId])
        } else {
            setFolderPath([])
        }
        setFocusCanvasTrigger(prev => prev + 1)
    }, [])

    const navigateBack = useCallback(() => {
        setFolderPath((prev) => navigateBackUtils(prev))
        setFocusCanvasTrigger(prev => prev + 1)
    }, [])

    const clearCanvas = useCallback(() => {
        setCanvasContent('')
        setCurrentDocumentId(null)
        setFocusCanvasTrigger(prev => prev + 1)
    }, [])

    const startNewDocument = useCallback(() => {
        // Clear canvas and reset document ID to allow creating a new one
        // Saving will handle the creation in the current folder path
        setCanvasContent('')
        setCurrentDocumentId(null)
        setFocusCanvasTrigger(prev => prev + 1)
    }, [])

    return (
        <FileSystemContext.Provider
            value={{
                documents,
                folders,
                currentDocumentId,
                folderPath,
                canvasContent,
                isLoading,
                focusCanvasTrigger,
                triggerCanvasFocus,
                loadDocument,
                saveDocument,
                deleteDocument,
                deleteCurrentDocument,
                createFolder,
                deleteFolder,
                updateFolderName,
                updateDocumentTitle,
                navigateToFolder,
                navigateBack,
                setCanvasContent,
                clearCanvas,
                startNewDocument
            }}
        >
            {children}
        </FileSystemContext.Provider>
    )
}

export function useFileSystem() {
    const context = useContext(FileSystemContext)
    if (context === undefined) {
        throw new Error('useFileSystem must be used within a FileSystemProvider')
    }
    return context
}
