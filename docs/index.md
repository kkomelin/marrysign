# Solidity API

## MarrySign

### AgreementState

```solidity
enum AgreementState {
  Created,
  Accepted,
  Refused,
  Terminated
}
```

### Agreement

```solidity
struct Agreement {
  bytes32 id;
  address alice;
  address bob;
  bytes content;
  uint256 terminationCost;
  enum MarrySign.AgreementState state;
  uint256 updatedAt;
}
```

### Pointer

```solidity
struct Pointer {
  uint256 index;
  bool isSet;
}
```

### CallerIsNotOwner

```solidity
error CallerIsNotOwner()
```

_Some features are only available to the contract owner, e.g. withdrawal._

### EmptyContent

```solidity
error EmptyContent()
```

_Agreement.content cannot be empty._

### BobNotSpecified

```solidity
error BobNotSpecified()
```

_When Bob is not set._

### InvalidTimestamp

```solidity
error InvalidTimestamp()
```

_We use it to check Agreement's createdAt, updatedAt, etc. timestamps._

### AccessDenied

```solidity
error AccessDenied()
```

_When the caller is not authorized to call a function._

### MustPayExactTerminationCost

```solidity
error MustPayExactTerminationCost()
```

_We should check if the termination cost passed is equivalent to that the agreement creator set._

### MustPayExactFee

```solidity
error MustPayExactFee()
```

_We should check if the amount passed is equivalent to our fee value._

### AgreementNotFound

```solidity
error AgreementNotFound()
```

_if there is no an active agreement by given criteria._

### AgreementCreated

```solidity
event AgreementCreated(bytes32 id)
```

Is emitted when a new agreement is created.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | bytes32 | {bytes32} The newly-created agreement ID. |

### AgreementAccepted

```solidity
event AgreementAccepted(bytes32 id)
```

Is emitted when the agreement is accepted by the second party (Bob).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | bytes32 | {bytes32} The accepted agreement ID. |

### AgreementRefused

```solidity
event AgreementRefused(bytes32 id)
```

Is emitted when the agreement is refused by any party.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | bytes32 | {bytes32} The refused agreement ID. |

### AgreementTerminated

```solidity
event AgreementTerminated(bytes32 id)
```

Is emitted when the agreement is terminated by any party.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | bytes32 | {bytes32} The terminated agreement ID. |

### constructor

```solidity
constructor() public payable
```

Contract constructor.

### getFee

```solidity
function getFee() public view returns (uint256)
```

### getAgreementCount

```solidity
function getAgreementCount() public view returns (uint256)
```

Get the number of all agreements.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | {uint256} |

### getAgreement

```solidity
function getAgreement(bytes32 id) public view returns (struct MarrySign.Agreement)
```

Get an agreement.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | bytes32 | {bytes32} Agreement ID. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct MarrySign.Agreement | {Agreement} |

### getAgreementByAddress

```solidity
function getAgreementByAddress(address partnerAddress) public view returns (struct MarrySign.Agreement)
```

Get an agreement by an address of one of the partners.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| partnerAddress | address | {address} Partner's address. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct MarrySign.Agreement | {Agreement} |

### getPaginatedAgreements

```solidity
function getPaginatedAgreements(uint256 _pageNum, uint256 _resultsPerPage) public view returns (struct MarrySign.Agreement[])
```

Get all agreements paginated.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pageNum | uint256 | {uint256} A page number, which should be greater than 0. |
| _resultsPerPage | uint256 | {uint256} A number of agreements per page, which should be greater than 0. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct MarrySign.Agreement[] | {Agreement[]} |

### getAcceptedAgreementCount

```solidity
function getAcceptedAgreementCount() public view returns (uint256)
```

Get the number of accepted agreements.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | {uint256} |

### getAcceptedAgreements

```solidity
function getAcceptedAgreements() public view returns (struct MarrySign.Agreement[])
```

Get accepted agreements.

_@todo: Optimize : there are two similar loops.
@todo: Add pagination to not go over time/size limits._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct MarrySign.Agreement[] | {Agreement[]} |

### createAgreement

```solidity
function createAgreement(address bob, bytes content, uint256 terminationCost, uint256 createdAt) public payable
```

Create a new agreement and pay the service fee if set.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| bob | address | {address} The second party's adddress. |
| content | bytes | {bytes} The vow content. |
| terminationCost | uint256 | {uint256} The agreement termination cost. |
| createdAt | uint256 | {uint256} The creation date in seconds since the Unix epoch. |

### acceptAgreement

```solidity
function acceptAgreement(bytes32 id, uint256 acceptedAt) public payable
```

### refuseAgreement

```solidity
function refuseAgreement(bytes32 id, uint256 refusedAt) public
```

### terminateAgreement

```solidity
function terminateAgreement(bytes32 id) public payable
```

### withdraw

```solidity
function withdraw() public
```

### setFee

```solidity
function setFee(uint256 _fee) public
```

### validTimestamp

```solidity
modifier validTimestamp(uint256 timestamp)
```

Check the validity of the timespamp.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| timestamp | uint256 | {uint256} The timestamp being validated. |

### onlyOwner

```solidity
modifier onlyOwner()
```

Check whether the caller is the contract-owner.

