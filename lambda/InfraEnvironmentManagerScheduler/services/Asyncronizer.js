function Asyncronizer() {
  
  var self = this;
  
  var argumentsToArray = function (args) {
    var result = [];
    for (var index in args) {
      result.push(args[index]);
    }
    return result;
  };
  
  self.parallelizeTasks = function (tasks, callback) {
    
    var incompleteTasks = tasks.length;
    var providedTasks = tasks.length;
    var callbackCalled = false;
    
    function doesCallbackNeedToBeCalled(error) {
      // Does not need to be called as already did.
      if (callbackCalled) return false;
      
      // Needs to be called as all tasks have been executed.
      if (incompleteTasks === 0) return true;
      
      // Needs to be called because an error has occurred.
      if (error) return true;
      
      // Does not need to be called as task executed fine
      return false;
    }
    
    if (doesCallbackNeedToBeCalled()) {
      callback();
      return;
    }
    
    for (var taskIndex = 0; taskIndex < providedTasks; taskIndex++) {
      var task = tasks[taskIndex];
      
      var taskCallback = function (error) {
        incompleteTasks--;
        if (!doesCallbackNeedToBeCalled(error)) return;
        
        callbackCalled = true;
        callback(error);
      };
      
      task(taskCallback);
    }

  };
  
  self.serializeTasks = function (tasks, callback) {
    
    function executeTask(taskIndex, additionalArguments) {
      
      var task = tasks[taskIndex];
      if (!task) {
        callback();
        return;
      }
      
      var taskCallback = function (/*arguments*/) {
        var args = argumentsToArray(arguments);
        var error = args[0];
        
        if (error) callback(error);
        else executeTask(taskIndex + 1, args.slice(1));
      };
      
      task.apply(null, [taskCallback].concat(additionalArguments));
    }
    
    executeTask(0, []);

  };

}

module.exports = Asyncronizer;