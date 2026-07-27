window.GYM_CONFIG = {
  appName: "GymFlow",

  // Choose one of the 10 available themes. Change this value to rebrand your gym.
  colorTheme: "neon-lime",

  firebase: {
    apiKey: "AIzaSyCo6eNYZUtbLxVSxWRSXMVdJDh34yfTEXc",
    authDomain: "cnp-automation-project.firebaseapp.com",
    projectId: "cnp-automation-project",
    storageBucket: "cnp-automation-project.firebasestorage.app",
    messagingSenderId: "1040731849321",
    appId: "1:1040731849321:web:028463d3f230d9a86758f8"
  }
};

// Apply color theme immediately so the browser paints the correct theme on the
// first frame.
(function () {
  var t = window.GYM_CONFIG.colorTheme;
  if (t && t !== "neon-lime") {
    document.documentElement.setAttribute("data-color-theme", t);
  }
})();
