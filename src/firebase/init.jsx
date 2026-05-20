// Firebase init — anonymous auth + realtime database
// Uses Firebase compat SDK loaded via CDN script tags
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyARPrvUqfnf_N-yY-evEb5zFJvrJfMcCc8",
    authDomain: "cards-of-civ.firebaseapp.com",
    // NOTE: databaseURL was not in the provided snippet. Default region assumed.
    // If your RTDB instance is in a different region, the Firebase console
    // (Realtime Database tab) shows the real URL — paste it here.
    databaseURL: "https://cards-of-civ-default-rtdb.firebaseio.com",
    projectId: "cards-of-civ",
    storageBucket: "cards-of-civ.firebasestorage.app",
    messagingSenderId: "104958231788",
    appId: "1:104958231788:web:956bb5458ab1b37d9c51c9",
    measurementId: "G-F757MCCC2P",
  };

  firebase.initializeApp(firebaseConfig);

  window.fb = {
    app: firebase.app(),
    auth: firebase.auth(),
    db: firebase.database(),
    sv: firebase.database.ServerValue,
  };

  // Auto sign-in anonymously
  window.fb.ready = new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged((u) => {
      if (u) resolve(u);
    });
    firebase.auth().signInAnonymously().catch((err) => {
      console.error("[fb] anon sign-in failed:", err);
      reject(err);
    });
  });
})();
