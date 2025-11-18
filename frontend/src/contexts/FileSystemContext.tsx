import React, { createContext, useContext, useState, useRef, useCallback } from 'react'
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
    navigateToFolder: (id: string | null) => void
    navigateBack: () => void
    setCanvasContent: (content: string) => void
    clearCanvas: () => void
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

    const triggerCanvasFocus = useCallback(() => {
        setFocusCanvasTrigger(prev => prev + 1)
    }, [])

    // Track pending title generation
    const titleGenerationRef = useRef<string | null>(null)

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
        const isUpdate = !!currentDocumentId

        // Check if document actually changed
        let contentChanged = false
        if (isUpdate) {
            const existingDoc = documents.find(d => d.id === currentDocumentId)
            if (existingDoc) {
                const currentText = extractTextFromHTML(trimmedContent)
                const existingText = extractTextFromHTML(existingDoc.content)
                contentChanged = currentText !== existingText
                const folderChanged = existingDoc.folderId !== getCurrentFolderId(folderPath)

                if (!contentChanged && !folderChanged) {
                    setCanvasContent('')
                    setCurrentDocumentId(null)
                    return
                }
            }
        }

        const docId = isUpdate ? currentDocumentId : generateId('doc')
        const existingDoc = documents.find(d => d.id === docId)

        const newDoc: Document = isUpdate && existingDoc
            ? {
                ...existingDoc,
                content: trimmedContent,
                updatedAt: now,
                folderId: getCurrentFolderId(folderPath),
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
            ? documents.map(doc => doc.id === docId ? newDoc : doc)
            : [...documents, newDoc]

        setDocuments(updatedDocuments)
        setCanvasContent('')
        setCurrentDocumentId(null)

        // Request canvas focus for new document
        setFocusCanvasTrigger(prev => prev + 1)

        // Title Generation
        const shouldRegenerateTitle = !isUpdate || contentChanged

        if (shouldRegenerateTitle) {
            titleGenerationRef.current = docId

            const timeoutId = !isUpdate ? setTimeout(() => {
                if (titleGenerationRef.current === docId) {
                    setDocuments((prev) => prev.map((doc) =>
                        doc.id === docId ? { ...doc, titleLoading: false } : doc
                    ))
                    titleGenerationRef.current = null
                }
            }, ANIMATIONS.TITLE_GENERATION_TIMEOUT) : null

            try {
                const title = await generateTitle(trimmedContent)

                if (timeoutId) clearTimeout(timeoutId)

                if (titleGenerationRef.current === docId) {
                    setDocuments((prev) => prev.map((doc) =>
                        doc.id === docId
                            ? { ...doc, title, titleLoading: false, titleJustGenerated: true }
                            : doc
                    ))
                    titleGenerationRef.current = null

                    setTimeout(() => {
                        setDocuments((prev) => prev.map((doc) =>
                            doc.id === docId ? { ...doc, titleJustGenerated: false, documentJustCreated: false } : doc
                        ))
                    }, ANIMATIONS.TITLE_FADE_IN)
                }
            } catch (error) {
                console.error('Failed to generate title:', error)
                if (timeoutId) clearTimeout(timeoutId)
                setDocuments((prev) => prev.map((doc) =>
                    doc.id === docId ? { ...doc, titleLoading: false } : doc
                ))
            }
        }
    }, [documents, currentDocumentId, folderPath, setDocuments])

    const deleteDocument = useCallback((documentId: string) => {
        setDocuments((prev) => prev.filter(doc => doc.id !== documentId))
        if (currentDocumentId === documentId) {
            setCanvasContent('')
            setCurrentDocumentId(null)
        }
    }, [currentDocumentId, setDocuments])

    const deleteCurrentDocument = useCallback(() => {
        if (currentDocumentId) {
            setDocuments((prev) => prev.map((doc) =>
                doc.id === currentDocumentId ? { ...doc, documentDeleting: true } : doc
            ))

            setTimeout(() => {
                deleteDocument(currentDocumentId)
                setFocusCanvasTrigger(prev => prev + 1)
            }, ANIMATIONS.DOCUMENT_SLIDE_OUT)
        } else {
            setCanvasContent('')
            setFocusCanvasTrigger(prev => prev + 1)
        }
    }, [currentDocumentId, deleteDocument, setDocuments])

    const createFolder = useCallback((name: string) => {
        const now = Date.now()
        const currentFolderId = getCurrentFolderId(folderPath)
        const newFolder = {
            id: generateId('folder'),
            name,
            parentFolderId: currentFolderId,
            createdAt: now,
            updatedAt: now,
        }

        setFolders((prev) => [...prev, newFolder])
        setFolderPath((prev) => [...prev, newFolder.id])
        setFocusCanvasTrigger(prev => prev + 1)
    }, [folderPath, setFolders])

    const deleteFolder = useCallback((folderId: string) => {
        const { folders: updatedFolders, documents: updatedDocuments } = deleteFolderRecursive(
            folders,
            documents,
            folderId
        )
        setFolders(updatedFolders)
        setDocuments(updatedDocuments)

        if (folderPath.includes(folderId)) {
            const indexOfDeleted = folderPath.indexOf(folderId)
            setFolderPath(folderPath.slice(0, indexOfDeleted))
        }
    }, [folders, documents, folderPath, setFolders, setDocuments])

    const updateFolderName = useCallback((folderId: string, newName: string) => {
        const now = Date.now()
        setFolders((prev) => prev.map(folder =>
            folder.id === folderId
                ? { ...folder, name: newName, updatedAt: now }
                : folder
        ))
    }, [setFolders])

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
                navigateToFolder,
                navigateBack,
                setCanvasContent,
                clearCanvas
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
