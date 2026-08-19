-- Garde-fou au niveau base de donnees, redondant avec la transaction applicative
-- de ReservationsService.confirmer() (backend/src/reservation/reservations.service.ts).
-- Objectif : meme si un futur bug applicatif contournait la garde `updateMany({ where: { statut: 'libre' } })`
-- (par exemple un appel direct a `creneau.update()` par id sans reverifier le statut courant),
-- la base de donnees elle-meme refuse qu'un creneau deja "reserve" soit reserve une seconde fois.
CREATE OR REPLACE FUNCTION empecher_double_reservation_creneau()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."statut" = 'reserve' AND NEW."statut" = 'reserve' THEN
    RAISE EXCEPTION 'Le creneau % est deja reserve : impossible de le reserver a nouveau.', NEW."id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empecher_double_reservation_creneau
BEFORE UPDATE ON "Creneau"
FOR EACH ROW
EXECUTE FUNCTION empecher_double_reservation_creneau();
