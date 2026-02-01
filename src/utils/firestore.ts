import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  documentId,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection names
export const COLLECTIONS = {
  CLASSES: 'classes',
  STUDENTS: 'students',
  JOURNALS: 'journals',
  JOURNAL_STUDENTS: 'journalStudents',
  LESSONS: 'lessons',
  ATTENDANCE: 'attendance',
  GRADES: 'grades',
  CLASSROOMS: 'classrooms',
  SEATING_ARRANGEMENTS: 'seatingArrangements',
  ARTIFACTS: 'artifacts',
  SUBJECTS: 'subjects',
  TAGS: 'tags',
} as const;

// Get collection reference
export const getCollectionRef = (collectionName: string) => {
  return collection(db, collectionName);
};

// Get document reference
export const getDocRef = (collectionName: string, docId: string) => {
  return doc(db, collectionName, docId);
};

// Create document
export const createDocument = async <T>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> => {
  const collectionRef = getCollectionRef(collectionName);

  // Remove undefined values from data
  const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  const docRef = await addDoc(collectionRef, {
    ...cleanData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

// Get document by ID
export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const docRef = getDocRef(collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }

  return null;
};

// Get documents with query
export const getDocuments = async <T>(
  collectionName: string,
  ...queryConstraints: QueryConstraint[]
): Promise<T[]> => {
  const collectionRef = getCollectionRef(collectionName);
  const q = query(collectionRef, ...queryConstraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
};

// Get multiple documents by IDs (batch retrieval)
export const getDocumentsByIds = async <T>(
  collectionName: string,
  ids: string[]
): Promise<T[]> => {
  if (ids.length === 0) return [];

  // Firestore 'in' queries are limited to 10 items at a time
  // Split into batches of 10
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) {
    batches.push(ids.slice(i, i + 10));
  }

  const results = await Promise.all(
    batches.map(batch => {
      const collectionRef = getCollectionRef(collectionName);
      const q = query(collectionRef, where(documentId(), 'in', batch));
      return getDocs(q);
    })
  );

  const documents: T[] = [];
  results.forEach(querySnapshot => {
    querySnapshot.docs.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() } as T);
    });
  });

  return documents;
};

// Update document
export const updateDocument = async <T>(
  collectionName: string,
  docId: string,
  data: Partial<Omit<T, 'id'>>
): Promise<void> => {
  const docRef = getDocRef(collectionName, docId);

  // Remove undefined values from data
  const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  await updateDoc(docRef, {
    ...cleanData,
    updatedAt: Timestamp.now(),
  });
};

// Delete document
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  const docRef = getDocRef(collectionName, docId);
  await deleteDoc(docRef);
};

// Run Firestore transaction
export const runFirestoreTransaction = async <T>(
  updateFunction: (transaction: any) => Promise<T>
): Promise<T> => {
  return await runTransaction(db, updateFunction);
};

// Query helpers
export { where, orderBy, Timestamp, runTransaction };
