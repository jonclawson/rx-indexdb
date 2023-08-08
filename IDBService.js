import { Observable } from 'rxjs';

export class IDBService {
  dbName = 'testDbPath';
  initData;
  schema;
  // schema = Something like this.
  // {
  //   stores: [
  //     {
  //       name: 'customers',
  //       keyPath: 'snn',
  //       indexes: [
  //         {key: 'name', name: 'name', unique: false},
  //         {key: 'email', name: 'email', unique: true},
  //       ]
  //     }
  //   ]
  // }
  request;
  version;

  constructor(dbName, schema, initData, version) {
    this.dbName = dbName;
    this.schema = schema;
    this.initData = initData;
    this.version = version;
    this.init().subscribe((r) => console.log(r));
  }

  open() {
    return (this.request = indexedDB.open(this.dbName, this.version));
  }

  init() {
    return new Observable((observe) => {
      this.open();
      this.request.onerror = (event) => {
        console.log(event);
        observe.next('failed to open db');
      };
      this.request.onsuccess = () => {
        observe.next('db opened successful');
      };
      this.request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.schema.stores.forEach((store) => {
          const objectStore = db.createObjectStore(store.name, {
            keyPath: store.keyPath,
          });
          store.indexes.forEach((index) => {
            objectStore.createIndex(index.key, index.name, {
              unique: index.unique,
            });
          });
          objectStore.transaction.oncomplete = (event) => {
            const customerObjectStore = db
              .transaction(store.name, 'readwrite')
              .objectStore(store.name);
            this.initData.forEach((obj) => {
              customerObjectStore.add(obj);
            });
            observe.next('upgrade complete');
          };
        });
      };
    });
  }

  getAll(store) {
    return new Observable((observe) => {
      const request = this.open();
      request.onerror = (event) => {
        observe.next(event);
      };
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([store]);
        const objectStore = transaction.objectStore(store);

        objectStore.getAll().onsuccess = (event) => {
          observe.next(event.target.result);
        };
      };
    });
  }

  get(id, store) {
    return new Observable((observe) => {
      const request = this.open();
      request.onerror = (event) => {
        observe.next(event);
      };
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([store]);
        const objectStore = transaction.objectStore(store);
        const request = objectStore.get(id);
        this.request.onerror = (event) => {
          // Handle errors!
        };
        request.onsuccess = (event) => {
          // Do something with the request.result!
          observe.next(request.result);
        };
      };
    });
  }

  add(data, store) {
    return new Observable((observe) => {
      this.open();
      this.request.onerror = (event) => {
        console.log(event);
        observe.next(event);
      };
      this.request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([store], 'readwrite');

        transaction.oncomplete = (event) => {
          observe.next('items added');
        };

        transaction.onerror = (event) => {
          observe.next(event);
        };

        const objectStore = transaction.objectStore(store);
        data.forEach((customer) => {
          const request = objectStore.add(customer);
          request.onsuccess = (event) => {
            observe.next('item added');
          };
        });
      };
    });
  }

  put(data, store) {
    return new Observable((observe) => {
      this.open();
      this.request.onerror = (event) => {
        observe.next(event);
      };
      this.request.onsuccess = (event) => {
        const db = event.target.result;
        const objectStore = db
          .transaction([store], 'readwrite')
          .objectStore(store);

        const keyPath = this.schema.stores.find(
          (s) => s.name === store
        ).keyPath;
        const request = objectStore.get(data[keyPath]);
        request.onerror = (event) => {};
        request.onsuccess = (event) => {
          const requestUpdate = objectStore.put(data);
          requestUpdate.onerror = (event) => {};
          requestUpdate.onsuccess = (event) => {
            observe.next('data updated');
          };
        };
      };
    });
  }

  delete(id, store) {
    return new Observable((observe) => {
      const request = this.open();
      request.onerror = (event) => {
        observe.next(event);
      };
      request.onsuccess = (event) => {
        const db = event.target.result;
        const request = db
          .transaction([store], 'readwrite')
          .objectStore(store)
          .delete(id);
        request.onsuccess = (event) => {
          observe.next(id + ' deleted');
        };
      };
    });
  }
}
