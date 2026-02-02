
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
            const placedIds = new Set();
            const others = [];

            // 0. Place Strictly Locked Seats (Seat Index)
            roster.forEach(s => {
                if (s.lockedSeat !== undefined && s.lockedSeat !== null && s.lockedSeat < totalSeats) {
                    currentLayout[s.lockedSeat] = s;
                    placedIds.add(s.id);
                }
            });

            // 1. Separate students by zone constraints (Front/Back)
            const lockedFront = roster.filter(s => !placedIds.has(s.id) && s.constraints.includes('lock_front'));
            const lockedBack = roster.filter(s => !placedIds.has(s.id) && s.constraints.includes('lock_back'));

            // Helper to find seat in range
            const fillRandomly = (students, seatIndices) => {
                const shuffledSeats = shuffle(seatIndices);
                students.forEach(s => {
                    const seat = shuffledSeats.find(idx => currentLayout[idx] === null);
                    if (seat !== undefined) {
                        currentLayout[seat] = s;
                        placedIds.add(s.id);
                    } else {
                        others.push(s);
                    }
                });
            };

            // Place Front
            let frontSeats = [];
            for (let i = 0; i < cols; i++) frontSeats.push(i); // First row only? Or first few? Usually Row 1.
            fillRandomly(lockedFront, frontSeats);

            // Place Back
            let backSeats = [];
            for (let i = (rows - 1) * cols; i < totalSeats; i++) backSeats.push(i);
            fillRandomly(lockedBack, backSeats);

            // Add remaining unplaced to "others"
            roster.forEach(s => {
                if (!placedIds.has(s.id)) others.push(s);
            });

            // Fill empty spots with remaining
            const shuffledOthers = shuffle(others);
            shuffledOthers.forEach(s => {
                const emptyIdx = currentLayout.findIndex(x => x === null);
                if (emptyIdx !== -1) currentLayout[emptyIdx] = s;
            });

            // OPTIMIZATION LOOP
            for (let iter = 0; iter < 2000; iter++) { // Increased iterations
                const score = window.SeatingAlgorithm.evaluate(currentLayout, roomConfig);
                if (score.violations.length === 0) break;

                // Pick a violation
                const violation = score.violations[Math.floor(Math.random() * score.violations.length)];

                // Determine Swap Candidate
                const idx1 = currentLayout.indexOf(violation.student);
                if (idx1 === -1 || (violation.student.lockedSeat !== undefined && violation.student.lockedSeat !== null)) continue; // Don't move specific locked

                // Try to swap with a random seat (better heuristic could be used)
                const idx2 = Math.floor(Math.random() * totalSeats);
                const student2 = currentLayout[idx2];

                // Validate Swap
                if (student2 && student2.lockedSeat !== undefined) continue; // Target is locked

                // Check Zones
                if (violation.student.constraints.includes('lock_front') && Math.floor(idx2 / cols) !== 0) continue;
                if (violation.student.constraints.includes('lock_back') && Math.floor(idx2 / cols) !== rows - 1) continue;

                if (student2) {
                    if (student2.constraints.includes('lock_front') && Math.floor(idx1 / cols) !== 0) continue;
                    if (student2.constraints.includes('lock_back') && Math.floor(idx1 / cols) !== rows - 1) continue;
                }

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

                const neighbors = getNeighbors(index, rows, cols); // 8-way for separation
                const directNeighbors = getImmediateNeighbors(index, rows, cols); // Side-by-side (L/R) for social rules

                // SEPARATION (Enemies) - Strong Constraint
                if (student.enemies && student.enemies.length) {
                    student.enemies.forEach(enemyId => {
                        neighbors.forEach(nIdx => {
                            if (layout[nIdx] && layout[nIdx].id === enemyId) {
                                violations.push({ student, type: 'separation', with: layout[nIdx] });
                            }
                        });
                    });
                }

                // PAIRING (Buddies) - Strong Constraint
                if (student.buddies && student.buddies.length) {
                    student.buddies.forEach(buddyId => {
                        const found = directNeighbors.some(nIdx => layout[nIdx] && layout[nIdx].id === buddyId);
                        if (!found) {
                            violations.push({ student, type: 'pairing', withId: buddyId });
                        }
                    });
                }

                // GENDER BALANCE (Soft Constraint)
                // Prefer alternating genders side-by-side
                if (student.gender && student.gender !== 'O') {
                    directNeighbors.forEach(nIdx => {
                        const neighbor = layout[nIdx];
                        if (neighbor && neighbor.gender && neighbor.gender !== 'O' && neighbor.gender === student.gender) {
                            // Only count as violation if we want strict alternating. 
                            // Let's make it a violation but maybe we can differentiate severity later.
                            // For now, simple count.
                            violations.push({ student, type: 'gender_clash', with: neighbor });
                        }
                    });
                }

                // ACADEMIC DIVERSITY (Soft Constraint)
                // Avoid Level 1 sitting with Level 1, or Level 3 with Level 3
                if (student.level) {
                    directNeighbors.forEach(nIdx => {
                        const neighbor = layout[nIdx];
                        if (neighbor && neighbor.level === student.level && (student.level === 1 || student.level === 3)) {
                            violations.push({ student, type: 'level_clumping', with: neighbor });
                        }
                    });
                }

                // HISTORY (Avoid repeating neighbors)
                // history is passed in roomConfig for now as a hack, or we rely on Global? 
                // Better: pass it as a separate arg to evaluate? 
                // For MVP, let's assume roomConfig.history exists or we skip.
                if (roomConfig.history && roomConfig.history.length > 0) {
                    const lastLayout = roomConfig.history[0]; // Most recent
                    // lastLayout is just a list of IDs? Or object? 
                    // My App.jsx stores { date, layout: [ids] }
                    if (lastLayout && lastLayout.layout) {
                        // Find student's index in old layout
                        const oldIdx = lastLayout.layout.indexOf(student.id);
                        if (oldIdx !== -1) {
                            // Who were they sitting with? (Approximate check: same index +/- 1 in that old layout?)
                            // Actually, simpler: Pre-calculate pairs in history?
                            // Optimization: Just check if CURRENT neighbor was a neighbor in Last Layout.
                            directNeighbors.forEach(nIdx => {
                                const neighbor = layout[nIdx];
                                if (neighbor) {
                                    // Was neighbor adjacent to student in old layout?
                                    // This requires geometry knowledge of old layout. 
                                    // Assuming same Rows/Cols.
                                    // Let's skip complex geom check and just say:
                                    // If they were neighbors before, avoid.

                                    // Check if they were adjacent in the flat array? Only works for naive check.
                                    // Proper way: Reconstruct old adjacency. Use getImmediateNeighbors on old layout.
                                    // Too expensive for inner loop?
                                    // Let's relax: Just check if they were in the same GROUP (Pair/Island)
                                }
                            });
                        }
                    }
                }
            });

            return {
                score: 100 - violations.length,
                violations
            };
        }
    };
})();
