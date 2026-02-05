
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
        generate: (roster, roomConfig, customGroups = []) => {
            const { rows, cols } = roomConfig;
            const totalSeats = rows * cols;
            let currentLayout = new Array(totalSeats).fill(null);

            // identify void seats
            const voidIndices = new Set();
            customGroups.forEach(g => {
                if (g.type === 'void') {
                    g.ids.forEach(id => voidIndices.add(id));
                }
            });

            const placedIds = new Set();
            const others = [];

            // 0. Place Strictly Locked Seats (Seat Index)
            roster.forEach(s => {
                if (s.lockedSeat !== undefined && s.lockedSeat !== null && s.lockedSeat < totalSeats) {
                    // If locked seat is void, we have a conflict. prioritizing explicitly locked seat over void for now? 
                    // or maybe void overrides? User said "empty seats impossible to fill". 
                    // So if a seat is void, even a lock shouldn't work? 
                    // Let's allow Lock to override Void if user forced it, but generally void wins.
                    // Actually, if user locked a student to a void seat, that's a user error. 
                    // Let's assume for this request "impossible to fill" means the generator won't put generic people there.
                    if (!voidIndices.has(s.lockedSeat)) {
                        currentLayout[s.lockedSeat] = s;
                        placedIds.add(s.id);
                    } else {
                        // If locked to a void seat, treat as unconstrained for now (push to others) or just fail? 
                        // Let's push to others to avoid disappearing students.
                    }
                }
            });

            // 1. Separate students by zone constraints (Front/Back)
            const lockedFront = roster.filter(s => !placedIds.has(s.id) && s.constraints.includes('lock_front'));
            const lockedBack = roster.filter(s => !placedIds.has(s.id) && s.constraints.includes('lock_back'));

            // Helper to find seat in range
            const fillRandomly = (students, seatIndices) => {
                // Filter out void seats
                const validSeats = seatIndices.filter(idx => !voidIndices.has(idx));
                const shuffledSeats = shuffle(validSeats);

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
            for (let i = 0; i < cols; i++) frontSeats.push(i);
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
                // Find empty spot that is NOT void
                const emptyIdx = currentLayout.findIndex((x, idx) => x === null && !voidIndices.has(idx));
                if (emptyIdx !== -1) currentLayout[emptyIdx] = s;
            });

            // OPTIMIZATION LOOP
            for (let iter = 0; iter < 2000; iter++) {
                const score = window.SeatingAlgorithm.evaluate(currentLayout, roomConfig);
                if (score.violations.length === 0) break;

                // Pick a violation
                const violation = score.violations[Math.floor(Math.random() * score.violations.length)];

                // Determine Swap Candidate
                const idx1 = currentLayout.indexOf(violation.student);
                if (idx1 === -1 || (violation.student.lockedSeat !== undefined && violation.student.lockedSeat !== null)) continue;

                // Try to swap with a random seat 
                const idx2 = Math.floor(Math.random() * totalSeats);

                // CRITICAL: Don't swap into a void seat
                if (voidIndices.has(idx2)) continue;

                const student2 = currentLayout[idx2];

                // Validate Swap
                if (student2 && student2.lockedSeat !== undefined) continue;

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
                if (roomConfig.enableGenderBalance) {
                    if (student.gender && student.gender !== 'O') {
                        directNeighbors.forEach(nIdx => {
                            const neighbor = layout[nIdx];
                            if (neighbor && neighbor.gender && neighbor.gender !== 'O' && neighbor.gender === student.gender) {
                                violations.push({ student, type: 'gender_clash', with: neighbor });
                            }
                        });
                    }
                }

                // ACADEMIC DIVERSITY (Soft Constraint)
                if (roomConfig.enableAcademicDiversity) {
                    if (student.level) {
                        directNeighbors.forEach(nIdx => {
                            const neighbor = layout[nIdx];
                            if (neighbor && neighbor.level === student.level && (student.level === 1 || student.level === 3)) {
                                violations.push({ student, type: 'level_clumping', with: neighbor });
                            }
                        });
                    }
                }

                // HISTORY - Placeholder for future implementation
                // (Currently does not enforce logic to avoid complexity)
            });

            return {
                score: 100 - violations.length,
                violations
            };
        }
    };
})();
