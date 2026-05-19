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


        At floor 0
            Set indicator to go up since that's the only way to go


        At highest floor:
            Set indicator to go down since that's the only way to go
    */
    init: function(es, fs) {
        function getScheduledFloors(isUp) {
            // get all floors scheduled for an up/down elevator depending on isUp
            let scheduledFs = new Set();

            return es
            .filter(e => isUp ? e.goingUpIndicator() : e.goingDownIndicator())
            .map(e => scheduledFs.add(...e.destinationQueue))
        }

        function upButtonPressed(f) {
            // console.log("Up button pressed");
            if (getScheduledFloors(true).includes(f.floorNum())) {
                // console.log("Already Scheduled, skipping.")
                return
            }

            if (idleEs.size) {
                // make an idle elevator go to it
                // for now we just pick a random elevator from the set. TODO: pick the closest idle elevator
                let e = Array.from(idleEs)[0];
                // console.log(`${e} is idle, using that`)
                idleEs.delete(e);
                e.addToQueue(f.floorNum());
                
                e.goingUpIndicator(true);
                e.goingDownIndicator(false);
            } else {
                // find the highest elevator below this floor that is also going up, and add it to its queue
                let validEs = es.filter(e => e.goingUpIndicator() && e.currentFloor() < f.floorNum() && e.loadFactor() < 0.9);

                if (validEs.length) {
                    // only add it if we have a valid elevator to add
                    // for now we just pick a random elevator from the list. TODO: pick the highest valid elevator
                    let e = validEs.reduce((minE, e) => e.currentFloor() > minE.currentFloor() ? minE : e, validEs[0]);
                    console.log(`elevator ${e} is the highest elevator going that way, using that`)
                    e.addToQueue(f.floorNum());
                } else {
                    // console.log("No valid elevator, trying again in 0.1s")
                    setTimeout(() => upButtonPressed(f), 100); // couldn't assign any elevators, try assigning again later
                }
            }

            // console.log("");
        }

        function downButtonPressed(f) {
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
                let validEs = es.filter(e => e.goingDownIndicator() && e.currentFloor() > f.floorNum() && e.loadFactor() < 0.9);

                if (validEs.length) {
                    // only add it if we have a valid elevator to add
                    // for now we just pick a random elevator from the list. TODO: pick the highest valid elevator
                    let e = validEs.reduce((minE, e) => e.currentFloor() > minE.currentFloor() ? minE : e, validEs[0]);
                    // console.log(`elevator ${e} is the lowest elevator going that way, using that`);
                    e.addToQueue(f.floorNum());
                } else {
                    setTimeout(() => downButtonPressed(f), 100); // couldn't assign any elevators, try assigning again later
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
            })
        });

        fs.map(f => {
            f.on("up_button_pressed", () => upButtonPressed(f))

            f.on("down_button_pressed", () => downButtonPressed(f))
        })
    },
    update: function(dt, es, fs) {
        // We normally don't need to do anything here
    }
}