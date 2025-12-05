import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DataState, GlobalParameters } from '@/types/data';

interface CollectionsDB extends DBSchema {
  data: {
    key: string;
    value: DataState;
  };
  settings: {
    key: string;
    value: GlobalParameters | string;
  };
}

const DB_NAME = 'collections_dashboard_db';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase<CollectionsDB>> => {
  return openDB<CollectionsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
};

export const saveDataState = async (state: DataState) => {
  const db = await initDB();
  await db.put('data', state, 'current_state');
};

export const loadDataState = async (): Promise<DataState | undefined> => {
  const db = await initDB();
  return db.get('data', 'current_state');
};

export const saveGlobalParams = async (params: GlobalParameters) => {
  const db = await initDB();
  await db.put('settings', params, 'global_params');
};

export const loadGlobalParams = async (): Promise<GlobalParameters | undefined> => {
  const db = await initDB();
  return db.get('settings', 'global_params') as Promise<GlobalParameters | undefined>;
};

export const saveDsoMethod = async (method: string) => {
  const db = await initDB();
  await db.put('settings', method, 'dso_method');
};

export const loadDsoMethod = async (): Promise<string | undefined> => {
  const db = await initDB();
  return db.get('settings', 'dso_method') as Promise<string | undefined>;
};

export const clearData = async () => {
  const db = await initDB();
  await db.delete('data', 'current_state');
};
