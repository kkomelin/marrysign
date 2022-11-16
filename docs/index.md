# Solidity API

## CurrencyConverter

CurrencyConverter library allows to convert USD to ETH.

Inspired by https://github.com/PatrickAlphaC/hardhat-fund-me-fcc/blob/main/contracts/PriceConverter.sol
(by https://github.com/PatrickAlphaC).

### MULTIPLIER

```solidity
uint256 MULTIPLIER
```

_A multiplier which is used to support decimals._

### convertUSDToWei

```solidity
function convertUSDToWei(uint256 usdAmount, contract AggregatorV3Interface priceFeed) internal view returns (uint256)
```

Convert integer USD amount to Wei.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | {uint256} An amount in Wei. |

### getETHPriceInUSD

```solidity
function getETHPriceInUSD(contract AggregatorV3Interface priceFeed) private view returns (uint256, uint256)
```

Return current ETH price in USD (multiplied to 10**18).

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | {uint256} Latest ETH price in USD. |
| [1] | uint256 | {uint256} A number of decimals used to store the ETH price. |

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

### ZeroTerminationCost

```solidity
error ZeroTerminationCost()
```

_We don't allow zero termination cost._

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

### WrongAmount

```solidity
error WrongAmount()
```

_We check if the termination cost is close to what user pays on agreement termination. If not, we fire the error._

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

### ALLOWED_TERMINATION_COST_DIFFERENCE

```solidity
uint256 ALLOWED_TERMINATION_COST_DIFFERENCE
```

_Allowed termination cost set and paid difference in Wei. Because of the volatility._

### SERVICE_FEE_PERCENT

```solidity
uint8 SERVICE_FEE_PERCENT
```

_We charge this percent of the termination cost for our service._

### owner

```solidity
address payable owner
```

_The contract owner._

### agreements

```solidity
struct MarrySign.Agreement[] agreements
```

_List of all agreements created._

### pointers

```solidity
mapping(bytes32 => struct MarrySign.Pointer) pointers
```

_Maps Agreement.id to Agreement index for easier navigation._

### randomFactor

```solidity
uint256 randomFactor
```

_Used for making Agreement.IDs trully unique._

### priceFeed

```solidity
contract AggregatorV3Interface priceFeed
```

_Chainlink DataFeed client._

### constructor

```solidity
constructor(address priceFeedAddress) public payable
```

Contract constructor.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| priceFeedAddress | address | {address} Chainlink Price Feed address. |

### getAgreementCount

```solidity
function getAgreementCount() public view returns (uint256)
```

Get the number of all created agreements.

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

### getAcceptedAgreements

```solidity
function getAcceptedAgreements() public view returns (struct MarrySign.Agreement[])
```

Get accepted (public) agreements.

_@todo: Optimize : there are two similar loops.
@todo: Add pagination to not go over time/size limits._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct MarrySign.Agreement[] | {Agreement[]} |

### createAgreement

```solidity
function createAgreement(address bob, bytes content, uint256 terminationCost, uint256 createdAt) public
```

Create a new agreement.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| bob | address | {address} The second party's adddress. |
| content | bytes | {bytes} The vow content. |
| terminationCost | uint256 | {uint256} The agreement termination cost. |
| createdAt | uint256 | {uint256} The creation date in seconds since the Unix epoch. |

### acceptAgreement

```solidity
function acceptAgreement(bytes32 id, uint256 acceptedAt) public
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

### getPriceFeedVersion

```solidity
function getPriceFeedVersion() public view returns (uint256)
```

Get Chainlink PriceFeed version.

### getPriceFeed

```solidity
function getPriceFeed() public view returns (contract AggregatorV3Interface)
```

Get Chainlink PriceFeed instance.

### generateAgreementId

```solidity
function generateAgreementId(address alice, address bob, bytes content, uint256 terminationCost, uint256 randomFactorParam) private pure returns (bytes32)
```

Generate agreement hash which is used as its ID.

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

