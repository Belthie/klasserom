
(function () {
    const { shuffle } = window.Utils;

    // Helper to get neighbor indices
    const getNeighbors = (index, rows, cols) => {
        const neighbors = [];
        const r = Math.floor(index / cols);
        const c = index % cols;

        // 8-way connectivity for Checks (Separation)
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        dirs.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                neighbors.push(nr * cols + nc);
            }
        });
        return neighbors;
    };

    const getImmediateNeighbors = (index, rows, cols) => {
        // For Pairing (Side by Side preferred)
        const neighbors = [];
        const r = Math.floor(index / cols);
        const c = index % cols;
        // Check Left and Right ONLY for "Sitting Next To" usually? 
        // Or all 4? Let's assume Left/Right is strongest 'buddy' signal, but we can accept all 4.
        const dirs = [[0, -1], [0, 1]];
        dirs.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                neighbors.push(nr * cols + nc);
            }
        });
        return neighbors;
    };

    window.SeatingAlgorithm = {
        generate: (roster, roomConfig) => {
            const { rows, cols } = roomConfig;
            const totalSeats = rows * cols;
            let currentLayout = new Array(totalSeats).fill(null);

            // 1. Separate students by locking constraints
            const lockedFront = roster.filter(s => s.constraints.includes('lock_front'));
            const lockedBack = roster.filter(s => s.constraints.includes('lock_back'));
            // Isolation is a soft constraint we check later, or hard placement? 
            // "Sit Alone" -> Try to place where neighbors are empty. 
            // Hard to guarantee in full class. Treat as optimization rule.

            const pairs = [];
            const others = [];
            const placedIds = new Set();

            // Identify Pairs (This is tricky if data stricture is "A constraint B")
            // Assuming constraint format: { type: 'pair', with: 'id' }
            // detailed parsing needed.

            // For now, simple placement logic:

            // Helper to fill a seat
            const fillSeat = (index, joy) => {
                if (currentLayout[index] === null) {
                    currentLayout[index] = joy;
                    return true;
                }
                return false;
            };

            // Place Locked Front
            let frontSeats = [];
            for (let i = 0; i < cols; i++) frontSeats.push(i);
            frontSeats = shuffle(frontSeats);

            lockedFront.forEach(s => {
                const seat = frontSeats.find(idx => currentLayout[idx] === null);
                if (seat !== undefined) {
                    currentLayout[seat] = s;
                    placedIds.add(s.id);
                } else {
                    // Fallback if front full
                    others.push(s);
                }
            });

            // Place Locked Back
            let backSeats = [];
            for (let i = (rows - 1) * cols; i < totalSeats; i++) backSeats.push(i);
            backSeats = shuffle(backSeats);

            lockedBack.forEach(s => {
                if (placedIds.has(s.id)) return;
                const seat = backSeats.find(idx => currentLayout[idx] === null);
                if (seat !== undefined) {
                    currentLayout[seat] = s;
                    placedIds.add(s.id);
                } else {
                    others.push(s);
                }
            });

            // Add remaining to "others" bucket
            roster.forEach(s => {
                if (!placedIds.has(s.id)) others.push(s);
            });

            // Shuffle others
            const shuffledOthers = shuffle(others);

            // Fill empty spots
            shuffledOthers.forEach(s => {
                // Find empty spot
                // Simple First Empty:
                const emptyIdx = currentLayout.findIndex(x => x === null);
                if (emptyIdx !== -1) currentLayout[emptyIdx] = s;
            });

            // OPTIMIZATION LOOP
            // Try to fix constraints
            for (let iter = 0; iter < 1000; iter++) {
                const score = window.SeatingAlgorithm.evaluate(currentLayout, roomConfig);
                if (score.violations.length === 0) break;

                // Pick a violation
                const violation = score.violations[Math.floor(Math.random() * score.violations.length)];
                // Swap the source student with a random other seat
                const idx1 = currentLayout.indexOf(violation.student);
                const idx2 = Math.floor(Math.random() * totalSeats);

                if (idx1 === -1) continue; // Should not happen

                // Check if idx2 is locked?
                const student2 = currentLayout[idx2];
                if (student2 && (student2.constraints.includes('lock_front') || student2.constraints.includes('lock_back'))) {
                    continue; // flexible locking logic could allow swaps within zone, but skipping for safety
                }
                // Dont move locked student out of zone?
                if (violation.student.constraints.includes('lock_front') && idx2 >= cols) continue;

                // Swap
                [currentLayout[idx1], currentLayout[idx2]] = [currentLayout[idx2], currentLayout[idx1]];
            }

            return currentLayout;
        },

        evaluate: (layout, roomConfig) => {
            const { rows, cols } = roomConfig;
            let violations = [];
            let satisfied = 0;

            layout.forEach((student, index) => {
                if (!student) return;

                // Check Constraints
                // For simplicity, we assume student.constraints includes objects or strings?
                // Parsing generic constraints text or objects.
                // Assuming Roster has specific fields for simplicity in this MVP:
                // student.enemies = [id, id]
                // student.buddies = [id, id]

                const neighbors = getNeighbors(index, rows, cols);

                // SEPARATION
                if (student.enemies && student.enemies.length) {
                    student.enemies.forEach(enemyId => {
                        neighbors.forEach(nIdx => {
                            if (layout[nIdx] && layout[nIdx].id === enemyId) {
                                violations.push({ student, type: 'separation', with: layout[nIdx] });
                            }
                        });
                    });
                }

                // PAIRING (Must be checking immediate neighbors)
                if (student.buddies && student.buddies.length) {
                    const directNeighbors = getImmediateNeighbors(index, rows, cols);
                    student.buddies.forEach(buddyId => {
                        const found = directNeighbors.some(nIdx => layout[nIdx] && layout[nIdx].id === buddyId);
                        if (!found) {
                            violations.push({ student, type: 'pairing', withId: buddyId });
                        }
                    });
                }
            });

            return {
                score: 100 - violations.length, // crude score
                violations
            };
        }
    };
})();
