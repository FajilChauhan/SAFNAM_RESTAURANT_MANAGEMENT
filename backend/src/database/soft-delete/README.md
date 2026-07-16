# soft-delete

Contains reusable helpers for global soft-delete strategy.

Future repositories should query with `onlyActive()` and update records with `softDeleteData()` instead of physically deleting business data.
