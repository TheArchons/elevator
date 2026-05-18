{
    /*
        Algorithm description

        Init:
        All elevators are going up (since they start at the ground floor)

        Down Floor Button:

        If a down elevator is already scheduled to go to this floor, ignore it
        if there is an idle elevator, make idle elevator closest to this floor go to this floor (and remove it from the idle set)
        Else find the lowest elevator above this floor that is also going down, and add it to its queue

        Similarly for an Up Floor Button:

        If a up elevator is already scheduled to go to this floor, ignore it
        if there is an idle elevator, make idle elevator closest to this floor go to this floor (and remove it from the idle set)
        Else find the highest elevator below this floor that is also going up, and add it to its queue

        Note that in both cases we can ignore the case where there are no valid elevators to add, since the user will repress the butotn later anyway

        Floor Button Pressed:

        Assume that the user does not press a floor that is not in the direction of the elevator.

        Insert the floor into the queue.

        Idle:

        Add it to a set of idle elevators so it can be used
    */
    init: function(es, fs) {
        function getScheduledFloors(isUp) {
            // get all floors scheduled for an up/down elevator depending on isUp
            let scheduledFs = new Set();

            return es
            .filter(e => isUp ? e.goingUpIndicator() : e.goingDownIndicator())
            .map(e => scheduledFs.add(...e.destinationQueue))
        }

        let idleEs = new Set();

        es.map(e => {
            // inserts instead of appends
            e.addToQueue =(fNum) => {
                e.destinationQueue.push(fNum);
                e.destinationQueue.sort((a, b) => a - b)
                e.checkDestinationQueue();
            }
            e.goingDownIndicator(false);

            e.on("floor_button_pressed", fNum => {
                // could be more efficient with a binary search and insertion for O(n), but the number of floors is small anyway
                e.addToQueue(fNum)
            })

            e.on("idle", () => idleEs.add(e));

        });

        fs.map(f => {
            f.on("up_button_pressed", () => {
                if (getScheduledFloors(true).includes(f.floorNum())) {
                    return
                }

                if (idleEs.size) {
                    // make an idle elevator go to it
                    // for now we just pick a random elevator from the set. TODO: pick the closest idle elevator
                    let e = Array.from(idleEs)[0];
                    idleEs.delete(e);
                    e.addToQueue(f.floorNum());
                    
                    e.goingUpIndicator(true);
                    e.goingDownIndicator(false);
                } else {
                    // find the highest elevator below this floor that is also going up, and add it to its queue
                    let validEs = es.filter(e => e.goingUpIndicator() && e.currentFloor() <= f.floorNum());

                    if (validEs.length) {
                        // only add it if we have a valid elevator to add
                        // for now we just pick a random elevator from the list. TODO: pick the highest valid elevator
                        validEs[0].addToQueue(f.floorNum());
                    }
                }
            })

            f.on("down_button_pressed", () => {
                if (getScheduledFloors(false).includes(f.floorNum())) {
                    return
                }

                if (idleEs.size) {
                    // make an idle elevator go to it
                    // for now we just pick a random elevator from the set. TODO: pick the closest idle elevator
                    let e = Array.from(idleEs)[0];
                    idleEs.delete(e);
                    e.addToQueue(f.floorNum());
                    
                    e.goingUpIndicator(false);
                    e.goingDownIndicator(true);
                } else {
                    // find the lowest elevator above this floor that is also going down, and add it to its queue
                    let validEs = es.filter(e => e.goingDownIndicator() && e.currentFloor() >= f.floorNum());

                    if (validEs.length) {
                        // only add it if we have a valid elevator to add
                        // for now we just pick a random elevator from the list. TODO: pick the highest valid elevator
                        validEs[0].addToQueue(f.floorNum());
                    }
                }
            })
        })
    },
    update: function(dt, es, fs) {
        // We normally don't need to do anything here
    }
}