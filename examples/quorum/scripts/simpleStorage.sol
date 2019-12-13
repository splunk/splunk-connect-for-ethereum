pragma solidity ^0.5.0;

contract simplestorage {
  uint public storedData;

  event StorageEvent(uint data);

  constructor(uint initVal) public {
    storedData = initVal;
  }

  function set(uint x) public {
    storedData = x;
    emit StorageEvent(x);
  }

  function get() view public returns (uint retVal) {
    return storedData;
  }
}