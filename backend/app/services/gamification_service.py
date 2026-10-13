import json
from sqlalchemy.orm import Session
from app.models.dev_tester_models import DevProfile, UpzPointsLedger
from app.services.economy_rules import UpzPointsReward

def get_level_for_points(points: int) -> str:
    if points < 500:
        return "Scanner"
    elif points < 1500:
        return "White Hat"
    elif points < 3000:
        return "Bug Hunter"
    else:
        return "Cyber Ninja"

def add_points_and_level_up(
    db: Session,
    dev_profile: DevProfile,
    points_to_add: int,
    reason: str = "",
    commit: bool = True,
):
    """
    Adiciona pontos ao perfil do dev tester, recalcula o nível, salva a transação no Ledger 
    e adiciona um certificado de graduação se o nível subir.
    """
    # 1. Atualizar Saldo
    old_level = dev_profile.egolpe_level
    dev_profile.points += points_to_add
    
    # 2. Gravar no Ledger (Auditoria)
    if points_to_add != 0:
        ledger_entry = UpzPointsLedger(
            dev_profile_id=dev_profile.id,
            amount=points_to_add,
            reason=reason or "Ganho de UpzPoints Genérico"
        )
        db.add(ledger_entry)

    # 3. Recalcular Nível
    new_level = get_level_for_points(dev_profile.points)
    
    if new_level != old_level:
        dev_profile.egolpe_level = new_level
        # Gera o certificado se houver mudança de nível para maior
        try:
            certs = json.loads(dev_profile.certificates)
        except:
            certs = []
            
        certificate_name = f"Certificado de Graduação: {new_level}"
        if certificate_name not in certs:
            certs.append(certificate_name)
            dev_profile.certificates = json.dumps(certs)
            
    if commit:
        db.commit()
        db.refresh(dev_profile)
    return dev_profile

def process_app_founder_download(db: Session, dev_profile: DevProfile):
    """
    Premia o usuário com o valor estático configurado por baixar o App Founder.
    """
    return add_points_and_level_up(
        db, 
        dev_profile, 
        points_to_add=UpzPointsReward.APP_FOUNDER_DOWNLOAD, 
        reason="Download do App Founder (É Golpe)"
    )

def process_referral_bonus(db: Session, referrer_profile: DevProfile, new_user_name: str):
    """
    Premia o usuário que indicou um novo dev para a plataforma.
    """
    return add_points_and_level_up(
        db, 
        referrer_profile, 
        points_to_add=UpzPointsReward.REFERRAL_BONUS, 
        reason=f"Bônus de Indicação: Cadastrou {new_user_name}"
    )

def get_points_statement(db: Session, dev_profile_id: int):
    """
    Retorna o extrato completo de UpzPoints do desenvolvedor.
    """
    entries = db.query(UpzPointsLedger).filter(UpzPointsLedger.dev_profile_id == dev_profile_id).order_by(UpzPointsLedger.created_at.desc()).all()
    return [entry.to_dict() for entry in entries]
