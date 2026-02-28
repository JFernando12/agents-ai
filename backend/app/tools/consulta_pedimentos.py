import requests
from typing import Any, Optional

def consulta_pedimentos(
    periodo: int, 
    ejercicio: int, 
    tax_id_proveedor: Optional[str] = None, 
    razon_social: Optional[str] = None
) -> dict[str, Any]:
    """
    Consulta el listado de pedimentos a través de la API de CPA Vision.
    
    Args:
        periodo: Mes del periodo (1-12)
        ejercicio: Año del ejercicio (ej. 2025)
        tax_id_proveedor: RFC o Tax ID del proveedor (opcional)
        razon_social: Razón social del proveedor (opcional)
        
    Returns:
        dict: Respuesta con el listado de pedimentos o error
    """
    try:
        print(f"[TOOL EXECUTED] consulta_pedimentos - Periodo: {periodo}, Ejercicio: {ejercicio}")
        
        # Validar que al menos uno de los campos opcionales esté presente
        if not tax_id_proveedor and not razon_social:
            return {
                'success': False,
                'error': True,
                'message': 'Al menos uno de los campos tax_id_proveedor o razon_social debe estar presente'
            }
        
        # URL y token de la API
        url = "https://customsandtrade.cpavision.mx/api/ia/listado-pedimentos"
        token = "f7f9590d131cfddbc4c6144f3dd8fa1a49776294"
        
        # Preparar headers
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Preparar body
        body = {
            'periodo': periodo,
            'ejercicio': ejercicio,
            'tax_id_proveedor': tax_id_proveedor,
            'razon_social': razon_social
        }
        
        # Realizar petición POST
        response = requests.post(url, json=body, headers=headers, timeout=30)
        
        # Si es 422, es un error de validación esperado
        if response.status_code == 422:
            result = response.json()
            print(f"[TOOL VALIDATION ERROR] consulta_pedimentos: {result.get('message', 'Error de validación')}")
            return {
                'success': False,
                **result
            }
        
        # Para otros errores HTTP
        response.raise_for_status()
        
        # Parsear respuesta exitosa
        result = response.json()
        
        # Contar pedimentos
        num_pedimentos = len(result.get('listado_pedimentos', []))
        print(f"[TOOL SUCCESS] consulta_pedimentos - {num_pedimentos} pedimentos encontrados")
        
        return {
            'success': True,
            **result
        }
        
    except requests.RequestException as e:
        print(f"[TOOL ERROR] consulta_pedimentos failed: {str(e)}")
        return {
            'success': False,
            'error': True,
            'message': f"No se pudo consultar los pedimentos: {str(e)}"
        }
    except Exception as e:
        print(f"[TOOL ERROR] consulta_pedimentos unexpected error: {str(e)}")
        return {
            'success': False,
            'error': True,
            'message': f"Error inesperado al consultar pedimentos: {str(e)}"
        }
