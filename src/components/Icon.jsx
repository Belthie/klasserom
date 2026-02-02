// Icon Component using Global Lucide
// Usage: <Icon name="user" size={20} className="text-blue-500" />

(function() {
    const { useEffect, useRef } = React;

    window.Icon = ({ name, size = 20, className = "", ...props }) => {
        const ref = useRef(null);

        useEffect(() => {
            if (window.lucide && window.lucide.icons[name]) {
                const iconName = name; // Lucide icon name
                const svg = window.lucide.createElement(window.lucide.icons[iconName]);
                
                // Set attributes
                svg.setAttribute('width', size);
                svg.setAttribute('height', size);
                if (className) svg.setAttribute('class', className);
                
                // Clear and append
                if (ref.current) {
                    ref.current.innerHTML = '';
                    ref.current.appendChild(svg);
                }
            }
        }, [name, size, className]); // Re-run if props change

        return <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} {...props}></span>;
    };
})();
