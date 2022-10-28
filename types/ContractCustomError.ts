export enum ContractCustomError {
  CallerIsNotOwner = 'CallerIsNotOwner',
  EmptyContent = 'EmptyContent',
  InvalidTimestamp = 'InvalidTimestamp',
  InvalidAgreementId = 'InvalidAgreementId',
  ZeroTerminationCost = 'ZeroTerminationCost',
  BobNotSpecified = 'BobNotSpecified',
  AccessDenied = 'AccessDenied',
  MustPayExactTerminationCost = 'MustPayExactTerminationCost',
  AgreementNotFound = 'AgreementNotFound',
}
