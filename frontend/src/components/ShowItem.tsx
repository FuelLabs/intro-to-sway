interface ShowItemProps {
    id: number
}

export default function ShowItem({id}: ShowItemProps){
    console.log("ID:", id)
    return (
        <div>
            <h2>Show Item</h2>
        </div>
    )
}