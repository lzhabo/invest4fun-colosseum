create unique index if not exists baskets_one_draft_per_user_idx
  on app.baskets(user_id)
  where status = 'draft';
