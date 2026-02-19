(function () {
    window.Utils = {
        generateId: () => Math.random().toString(36).substr(2, 9),

        PALETTE: [
            'bg-red-100 border-red-200',
            'bg-orange-100 border-orange-200',
            'bg-amber-100 border-amber-200',
            'bg-yellow-100 border-yellow-200',
            'bg-lime-100 border-lime-200',
            'bg-green-100 border-green-200',
            'bg-emerald-100 border-emerald-200',
            'bg-teal-100 border-teal-200',
            'bg-cyan-100 border-cyan-200',
            'bg-sky-100 border-sky-200',
            'bg-blue-100 border-blue-200',
            'bg-indigo-100 border-indigo-200',
            'bg-violet-100 border-violet-200',
            'bg-purple-100 border-purple-200',
            'bg-fuchsia-100 border-fuchsia-200',
            'bg-pink-100 border-pink-200',
            'bg-rose-100 border-rose-200'
        ],

        getRandomColor: () => {
            const colors = window.Utils.PALETTE;
            return colors[Math.floor(Math.random() * colors.length)];
        },

        shuffle: (array) => {
            let currentIndex = array.length, randomIndex;
            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }
            return array;
        },

        MOCK_NAMES: [
            "Emma", "Oliver", "Ada", "William", "Sofie", "Lucas", "Nora", "Filip",
            "Maja", "Noah", "Olivia", "Elias", "Ella", "Isak", "Emilie", "Henrik",
            "Sara", "Jakob", "Mia", "Oskar", "Ingrid", "Sander", "Leah", "Magnus",
            "Anna", "Aleksander", "Vilde", "Mathias", "Frida", "Jonas"
        ]
    };
})();
