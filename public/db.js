let db;

if (!window.indexedDB) {
  console.log(
    "Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available."
  );
} else {
  const request = window.indexedDB.open('budget', 1);

  request.onupgradeneeded = (event) => {
    db = event.target.result;

    db.createObjectStore('transactions', {
      autoIncrement: true,
    });
  };

  request.onsuccess = (event) => {
    db = event.target.result;

    if (navigator.onLine) {
      checkDatabase();
    }
  };

  request.onerror = (event) => {
    console.log(event.target.error);
  };
}

function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(['transactions'], 'readwrite');
  // access your pending object store
  const objectStore = transaction.objectStore('transactions');
  // add record to your store with add method.
  objectStore.add(record);
}

function checkDatabase() {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(['transactions'], 'readwrite');
  // access your pending object store
  const objectStore = transaction.objectStore('transactions');
  // get all records from store and set to a variable
  const getAll = objectStore.getAll();

  getAll.onsuccess = (event) => {
    const result = event.target.result;

    if (result.length > 0) {
      fetch('api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(result),
        headers: {
          Accept: 'application/json,text/plain',
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(['transactions'], 'readwrite');
          // access your pending object store
          const objectStore = transaction.objectStore('transactions');
          // clear all items in your store
          objectStore.clear();
        });
    }
  };
}

window.addEventListener('online', checkDatabase);
