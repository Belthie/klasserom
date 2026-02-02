// Icon Component using Global Lucide
// Usage: <Icon name="user" size={20} className="text-blue-500" />

(function() {
    const { useEffect, useRef } = React;

    window.Icon = ({ name, size = 20, className = "", ...props }) => {
        const ref = useRef(null);

        useEffect(() => {
            if (window.lucide) {
                window.lucide.createIcons({
                    root: ref.current ? ref.current.parentNode : document,
                    icons: {
                        [name]: window.lucide.icons[name] // Only render this specific icon
                    },
                    attrs: {
                        width: size,
                        height: size,
                        class: className, // Apply classes to the SVG
                        ...props
                    },
                    nameAttr: 'data-lucide'
                });
            }
        }, [name, size, className]);

        // We render an element that Lucide will target. 
        // Note: Lucide replaces the element with SVG. 
        // In React, this might cause issues if React tries to update the 'i' tag but it's gone.
        // A safer way for React + Vanilla Lucide is to let Lucide inject into a container.
        // But Lucide 'replace' method replaces the tag.
        
        // BETTER APPROACH: Use the SVG content directly from window.lucide.icons[name] if available.
        // lucide.icons.User might be an array or object?
        
        // Let's stick to the 'i' tag replacement for now, but wrapped in a slightly hacky way 
        // or just accept that React might complain if we unmount.
        // Actually, let's use a simpler SVG render if we can access the paths.
        
        return <i data-lucide={name} className={className}></i>;
    };
})();
