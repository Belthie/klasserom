
// Bootstrap
(function () {
    const mount = () => {
        if (window.App && window.ReactDOM && window.Sidebar && window.GridMap && window.StudentCard) {
            const root = window.ReactDOM.createRoot(document.getElementById('root'));
            root.render(<window.App />);
        } else {
            // Retry if dependencies not ready (though Babel usually handles seq)
            setTimeout(mount, 50);
        }
    };
    mount();
})();
