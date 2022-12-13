export enum ECustomContractError {
  CallerIsNotOwner = 'CallerIsNotOwner',
  EmptyContent = 'EmptyContent',
  InvalidTimestamp = 'InvalidTimestamp',
  ZeroTerminationCost = 'ZeroTerminationCost',
  BobNotSpecified = 'BobNotSpecified',
  AccessDenied = 'AccessDenied',
  MustPayExactTerminationCost = 'MustPayExactTerminationCost',
  MustPayExactFee = 'MustPayExactFee',
  AgreementNotFound = 'AgreementNotFound',
}
