(function () {
    window.RandomStudentTab = ({ students, pickedHistory, onPickStudent, onResetPickHistory }) => {
        const [pickMode, setPickMode] = React.useState('random'); // 'random' | 'cycle'
        const [pickedStudent, setPickedStudent] = React.useState(null);
        const [showSettings, setShowSettings] = React.useState(true);

        const Icon = window.Icon || (({ name }) => <span>[{name}]</span>);

        const handlePick = () => {
            let candidates = students.filter(s => s.name);
            if (pickMode === 'cycle') {
                candidates = candidates.filter(s => !(pickedHistory || []).includes(s.id));
                if (candidates.length === 0) {
                    alert("Alle elever er trukket! Nullstill historikk for å starte på nytt.");
                    return;
                }
            }
            if (candidates.length === 0) {
                alert("Ingen elever tilgjengelig.");
                return;
            }

            const randomIndex = Math.floor(Math.random() * candidates.length);
            const selected = candidates[randomIndex];
            setPickedStudent(selected);
            onPickStudent(selected.id);
            setShowSettings(false);
        };

        return (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 w-full h-full min-h-screen">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Icon name="shuffle" size={18} className="text-indigo-600" />
                            Trekk tilfeldig elev
                        </h3>
                        {!showSettings && pickedStudent && (
                            <button onClick={() => setShowSettings(true)} className="text-xs text-slate-500 hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                                Innstillinger
                            </button>
                        )}
                    </div>

                    <div className="p-8 text-center min-h-[300px] flex flex-col justify-center">
                        {!showSettings && pickedStudent ? (
                            <div className="animate-in zoom-in duration-300 flex flex-col items-center justify-center space-y-8">
                                <div>
                                    <p className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-4">Utvalgt Elev</p>
                                    <div className="text-5xl font-black text-slate-800 py-10 px-8 bg-indigo-50 rounded-2xl border-2 border-indigo-100 shadow-inner w-full min-w-[300px] break-words">
                                        {pickedStudent.name}
                                    </div>
                                </div>
                                <button
                                    onClick={handlePick}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 text-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Icon name="refresh-cw" size={20} />
                                    Trekk en til
                                </button>
                                {pickMode === 'cycle' && (
                                    <p className="text-xs text-slate-500">
                                        {students.length - (pickedHistory || []).length} av {students.length} elever igjen
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8 flex flex-col justify-center h-full">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Trekkiemodus</h4>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button
                                            onClick={() => setPickMode('random')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${pickMode === 'random' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                        >
                                            Helt tilfeldig
                                        </button>
                                        <button
                                            onClick={() => setPickMode('cycle')}
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${pickMode === 'cycle' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                        >
                                            Gjennomgang
                                            {(pickedHistory || []).length > 0 && <span className="ml-1 text-xs opacity-70">({(pickedHistory || []).length})</span>}
                                        </button>
                                    </div>

                                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 text-sm text-indigo-800">
                                        {pickMode === 'random'
                                            ? "Trekker en tilfeldig elev fra hele listen hver gang (samme elev kan trekkes flere ganger)."
                                            : `Trekker en elev som IKKE har blitt trukket ennå.`
                                        }
                                    </div>
                                </div>

                                <button
                                    onClick={handlePick}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 text-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Icon name="play" size={24} />
                                    Trekk nå!
                                </button>

                                {pickMode === 'cycle' && (pickedHistory || []).length > 0 && (
                                    <button
                                        onClick={onResetPickHistory}
                                        className="text-sm text-red-500 hover:text-red-700 hover:underline font-medium"
                                    >
                                        Nullstill historikk ({Math.min(pickedHistory.length, students.length)} trukket)
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };
})();
