/**
 * Represents an unmanaged error
 * @param   {String} error      : Error message
 * @returns {UnmanagedErrorAnomaly}
 */

function UnmanagedErrorAnomaly(error) {
  
  this.Error = error;
  
  this.Type = "UnmanagedErrorAnomaly";
  this.toString = function () {
    return "An error has not been managed: " + error;
  };

}

module.exports = UnmanagedErrorAnomaly;