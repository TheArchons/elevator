{
    /*
        Algorithm description


        Init:
            All elevators are going up (since they start at the ground floor)


        Down Floor Button:
            If a down elevator is already scheduled to go to this floor, ignore it
            if there is an idle elevator, make idle elevator closest to this floor go to this floor (and remove it from the idle set)
            Else find the lowest elevator above this floor that is also going down (if it exists) that is not full, and add it to its queue
            if such an elevator does not exist, try again in 0.01s


        Similarly for an Up Floor Button:
            If a up elevator is already scheduled to go to this floor, ignore it
            if there is an idle elevator, make idle elevator closest to this floor go to this floor (and remove it from the idle set)
            Else find the highest elevator below this floor that is also going up (if it exists) that is not full, and add it to its queue
            if such an elevator does not exist, try again in 0.01s

        Floor Button Pressed:
            Assume that the user does not press a floor that is not in the direction of the elevator.

            Insert the floor into the queue.


        Idle:
            Add it to a set of idle elevators so it can be used

        Stopped at floor:

            At floor 0
                Set indicator to go up since that's the only way to go


            At highest floor:
                Set indicator to go down since that's the only way to go

            If the elevator is full:
                For each floor:
                    If noone in the elevator has requested this floor AND we are scheduled to stop at this floor.
                        Remove the floor from the list of scheduled floors.
                        "repress" the button on this floor so don't forget about it
    */
    init: function(es, fs) {
        const fullLimit = 0.75;
        const numFloors = fs.length;
        
        function getFloor(floorNum) {
            for (let f of fs) {
                if (f.floorNum() === floorNum) {
                    return f
                }
            }

            return null;
        }

        function getScheduledFloors(isUp) {
            // get all floors scheduled for an up/down elevator depending on isUp
            let scheduledFs = new Set();

            es
            .filter(e => isUp ? e.goingUpIndicator() : e.goingDownIndicator())
            .map(e => scheduledFs.add(...e.destinationQueue))

            return scheduledFs;
        }

        function buttonPressed(f, isUp) {
            if (getScheduledFloors(isUp).has(f.floorNum())) {
                console.log("Already Scheduled, skipping.")
                return
            }

            if (idleEs.size) {
                console.log("idle elevator found, using that")
                // make an idle elevator go to it
                let e = Array.from(idleEs).reduce((closestE, e) => Math.abs(closestE.currentFloor() - f.floorNum()) > Math.abs(e.currentFloor() - f.floorNum()) ? e : closestE);
                console.log(`${e} is idle, using that`)
                idleEs.delete(e);
                e.addToQueue(f.floorNum());
                
                e.goingUpIndicator(isUp);
                e.goingDownIndicator(!isUp);
            } else {
                let validEs = es.filter(e => 
                    (isUp === e.goingUpIndicator())
                    && (isUp ? e.currentFloor() < f.floorNum() : e.currentFloor() > f.floorNum())
                    && e.loadFactor() < fullLimit);

                if (validEs.length) {
                    // only add it if we have a valid elevator to add
                    let e = validEs.reduce((minE, e) => e.loadFactor() > minE.loadFactor() ? minE : e, validEs[0]);
                    console.log(`elevator ${e} is the best elevator going that way, using that`)
                    e.addToQueue(f.floorNum());
                } else {
                    // console.log("No valid elevator, trying again in 0.1s")
                    setTimeout(() => buttonPressed(f, isUp), 100); // couldn't assign any elevators, try assigning again later
                }
            }
        }

        let idleEs = new Set();

        es.map(e => {
            // inserts instead of appends
            e.addToQueue =(fNum) => {
                e.destinationQueue.push(fNum);
                e.destinationQueue.sort((a, b) => e.goingUpIndicator() ? a - b : b - a)
                e.checkDestinationQueue();
            }
            e.goingDownIndicator(false);

            e.on("floor_button_pressed", fNum => {
                // could be more efficient with a binary search and insertion for O(n), but the number of floors is small anyway
                e.addToQueue(fNum)
            })

            e.on("idle", () => idleEs.add(e));

            e.on("stopped_at_floor", (floorNum) => {
                if (floorNum === 0) {
                    e.goingUpIndicator(true);
                    e.goingDownIndicator(false);
                } else if (floorNum === fs.length - 1) {
                    // max floor
                    e.goingUpIndicator(false);
                    e.goingDownIndicator(true);
                }

                console.log(`checking if full ${e.loadFactor()} > fullLimit?`)
                if (e.loadFactor() > fullLimit) {
                    console.log("Elevator full, skipping...")
                    // skip all floors that we don't unload at
                    e.destinationQueue = e.destinationQueue.filter(floorNum => {
                        if (!e.getPressedFloors().includes(floorNum)) {
                            // re-press
                            let f = getFloor(floorNum)
                            if (floorNum === 0) {
                                buttonPressed(f, true);
                            } else if (floorNum === numFloors) {
                                buttonPressed(f, false);
                            } else if (e.goingUpIndicator()) {
                                buttonPressed(f, true);
                            } else {
                                buttonPressed(f, false);
                            }

                            return false;
                        }

                        return true;
                    });
                    e.checkDestinationQueue();
                }
            })

            e.on("passing_floor", (f, direction) => {

            })
        });

        fs.map(f => {
            f.on("up_button_pressed", () => buttonPressed(f, true))

            f.on("down_button_pressed", () => buttonPressed(f, false))
        })
    },
    update: function(dt, es, fs) {
        // We normally don't need to do anything here
    }
}