db.getSiblingDB('perfume-store').users.aggregate([{ $out: { db: 'DecantreBD', coll: 'users' } }]);
